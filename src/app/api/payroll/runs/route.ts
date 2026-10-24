import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { generatePayrollDraft } from "@/server/services/payroll";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const generateDraftSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export async function GET() {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  const runs = await prisma.payrollRun.findMany({
    where: { companyId: auth.session.companyId },
    include: {
      _count: { select: { items: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json(runs);
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = generateDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { month, year } = parsed.data;

    const run = await generatePayrollDraft({
      companyId: auth.session.companyId,
      month,
      year,
      createdById: auth.session.userId,
    });

    await createAuditLog({
      session,
      action: "PAYROLL_DRAFT_GENERATED",
      entityType: "PayrollRun",
      entityId: run.id,
      details: { month, year, totalEmployees: run.totalEmployees, totalNet: run.totalNet },
    });

    return NextResponse.json({
      success: true,
      message: `Payroll draft for ${month}/${year} generated successfully with ${run.totalEmployees} employees.`,
      run,
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode || 500;
    return NextResponse.json({ error: err.message || "Failed to generate payroll draft" }, { status });
  }
}
