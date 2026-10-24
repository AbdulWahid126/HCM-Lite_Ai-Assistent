import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized: Employee profile required" }, { status: 401 });
  }

  const items = await prisma.payrollItem.findMany({
    where: {
      employeeId: session.employeeId,
      payrollRun: { status: "FINALIZED" }, // only finalized payslips are visible to employees
    },
    include: {
      payrollRun: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
