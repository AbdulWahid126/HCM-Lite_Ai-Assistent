import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertEmployeeScope } from "@/server/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetEmployeeId = searchParams.get("employeeId") || session.employeeId;

  if (!targetEmployeeId) {
    return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
  }

  const scope = assertEmployeeScope(session, targetEmployeeId);
  if (!scope.permitted) return scope.response;

  const currentYear = new Date().getFullYear();

  // Fetch balances for this employee
  const balances = await prisma.leaveBalance.findMany({
    where: {
      employeeId: targetEmployeeId,
      year: currentYear,
    },
    include: { leaveType: true },
    orderBy: { leaveType: { name: "asc" } },
  });

  const formatted = balances.map((b) => ({
    id: b.id,
    leaveTypeId: b.leaveTypeId,
    name: b.leaveType.name,
    code: b.leaveType.code,
    allocated: b.allocated,
    used: b.used,
    pending: b.pending,
    available: Math.max(0, b.allocated - b.used - b.pending),
  }));

  return NextResponse.json(formatted);
}
