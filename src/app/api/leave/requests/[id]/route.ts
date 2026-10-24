import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { reviewLeaveRequest, cancelLeaveRequest } from "@/server/services/leave";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { action, comment } = parsed.data;

    const result = await reviewLeaveRequest({
      leaveRequestId: id,
      action,
      reviewerId: auth.session.userId,
      comment,
    });

    await createAuditLog({
      session,
      action: `LEAVE_${action}D`,
      entityType: "LeaveRequest",
      entityId: id,
      details: { action, comment },
    });

    return NextResponse.json({
      success: true,
      message: `Leave request successfully ${action.toLowerCase()}d.`,
      result,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return NextResponse.json({ error: err.message || "Failed to review leave request" }, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await cancelLeaveRequest(id, session.employeeId);

    await createAuditLog({
      session,
      action: "LEAVE_CANCELLED_BY_EMPLOYEE",
      entityType: "LeaveRequest",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "Leave request cancelled." });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return NextResponse.json({ error: err.message || "Failed to cancel leave request" }, { status });
  }
}
