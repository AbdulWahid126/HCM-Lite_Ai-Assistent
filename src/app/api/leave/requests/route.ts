import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applyForLeave } from "@/server/services/leave";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const applyLeaveSchema = z.object({
  leaveTypeId: z.string().min(1, "Leave type is required"),
  startDate: z.string().min(10, "Start date is required"),
  endDate: z.string().min(10, "End date is required"),
  reason: z.string().min(3, "Reason is required"),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  if (session.role === "EMPLOYEE") {
    if (!session.employeeId) return NextResponse.json({ error: "No employee profile found" }, { status: 400 });

    const requests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: session.employeeId,
        ...(status ? { status } : {}),
      },
      include: { leaveType: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  }

  // HR / Admin: Pending approval inbox or filter by status
  const requests = await prisma.leaveRequest.findMany({
    where: {
      employee: { companyId: session.companyId },
      ...(status ? { status } : {}),
    },
    include: {
      leaveType: true,
      employee: {
        include: { department: true, designation: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized: Employee profile required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = applyLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { leaveTypeId, startDate, endDate, reason } = parsed.data;

    const request = await applyForLeave({
      employeeId: session.employeeId,
      leaveTypeId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    });

    await createAuditLog({
      session,
      action: "LEAVE_REQUESTED",
      entityType: "LeaveRequest",
      entityId: request.id,
      details: { startDate, endDate, daysCount: request.daysCount, reason },
    });

    return NextResponse.json({
      success: true,
      message: `Leave application submitted for ${request.daysCount} working day(s).`,
      request,
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return NextResponse.json({ error: err.message || "Failed to apply for leave" }, { status });
  }
}
