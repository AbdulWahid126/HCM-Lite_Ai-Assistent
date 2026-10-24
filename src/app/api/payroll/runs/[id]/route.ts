import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { finalizePayroll } from "@/server/services/payroll";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          employee: {
            include: { department: true, designation: true },
          },
        },
        orderBy: { employee: { employeeCode: "asc" } },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Payroll run not found" }, { status: 404 });
  }

  return NextResponse.json(run);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  // ONLY Admin can finalize payroll per challenge brief requirement:
  // "Finalize payroll: Admin ONLY. HR may review drafts but cannot finalize them."
  const auth = assertRole(session, ["ADMIN"]);
  if (!auth.authorized) return auth.response;

  const { id } = await params;

  try {
    const finalized = await finalizePayroll({
      payrollRunId: id,
      adminId: auth.session.userId,
    });

    await createAuditLog({
      session,
      action: "PAYROLL_FINALIZED_AND_LOCKED",
      entityType: "PayrollRun",
      entityId: id,
      details: {
        month: finalized.month,
        year: finalized.year,
        totalNet: finalized.totalNet,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll run for ${finalized.month}/${finalized.year} has been finalized and locked.`,
      run: finalized,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return NextResponse.json({ error: err.message || "Failed to finalize payroll" }, { status });
  }
}
