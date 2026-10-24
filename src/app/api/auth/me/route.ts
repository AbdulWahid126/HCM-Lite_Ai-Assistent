import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      lastLoginAt: true,
      employee: {
        include: {
          department: true,
          designation: true,
          salaryStructure: true,
          company: {
            include: { settings: true },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ error: "User inactive or not found" }, { status: 401 });
  }

  // Get company settings
  const company = await prisma.company.findFirst({
    include: { settings: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      name: user.employee
        ? `${user.employee.firstName} ${user.employee.lastName}`
        : user.role,
      employee: user.employee,
    },
    company,
  });
}
