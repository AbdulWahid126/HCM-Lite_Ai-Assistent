import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertEmployeeScope } from "@/server/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const item = await prisma.payrollItem.findUnique({
    where: { id },
    include: {
      payrollRun: {
        include: { company: true },
      },
      employee: {
        include: {
          department: true,
          designation: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Payslip item not found" }, { status: 404 });
  }

  // Strict record-scope check: Employee can only access their own payslip
  const scope = assertEmployeeScope(session, item.employeeId);
  if (!scope.permitted) return scope.response;

  return NextResponse.json(item);
}
