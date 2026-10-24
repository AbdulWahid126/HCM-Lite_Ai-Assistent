import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertEmployeeScope } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { computeSalaryBreakdown } from "@/lib/tax-calculator";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const employeeSelfUpdateSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
});

const employeeAdminUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  departmentId: z.string().nullable().optional(),
  designationId: z.string().nullable().optional(),
  employmentStatus: z.enum(["ACTIVE", "PROBATION", "ON_LEAVE", "TERMINATED", "RESIGNED"]).optional(),
  basicSalary: z.number().positive().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scope = assertEmployeeScope(session, id);
  if (!scope.permitted) return scope.response;

  const currentYear = new Date().getFullYear();

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      department: true,
      designation: true,
      salaryStructure: session.role !== "EMPLOYEE" || session.employeeId === id, // employee views own salary
      leaveBalances: {
        where: { year: currentYear },
        include: { leaveType: true },
      },
      attendanceRecords: {
        orderBy: { date: "desc" },
        take: 30, // last 30 attendance records
      },
      leaveRequests: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { leaveType: true },
      },
      user: {
        select: { id: true, email: true, role: true, isActive: true, mustChangePassword: true, lastLoginAt: true },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json(employee);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const scope = assertEmployeeScope(session, id);
  if (!scope.permitted) return scope.response;

  try {
    const body = await req.json();

    // If session is Employee: only allow phone and address
    if (session.role === "EMPLOYEE") {
      const parsed = employeeSelfUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
      }

      const updated = await prisma.employee.update({
        where: { id },
        data: {
          phone: parsed.data.phone,
          address: parsed.data.address,
        },
      });

      await createAuditLog({
        session,
        action: "EMPLOYEE_SELF_PROFILE_UPDATED",
        entityType: "Employee",
        entityId: id,
        details: parsed.data,
      });

      return NextResponse.json({ success: true, employee: updated });
    }

    // If HR or Admin: allow full updates
    const parsed = employeeAdminUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { basicSalary, ...empData } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: empData,
      });

      if (basicSalary !== undefined) {
        const breakdown = computeSalaryBreakdown(basicSalary);
        await tx.salaryStructure.upsert({
          where: { employeeId: id },
          create: {
            employeeId: id,
            basicSalary: breakdown.basicSalary,
            hraAllowance: breakdown.hraAllowance,
            medicalAllowance: breakdown.medicalAllowance,
            grossSalary: breakdown.grossSalary,
          },
          update: {
            basicSalary: breakdown.basicSalary,
            hraAllowance: breakdown.hraAllowance,
            medicalAllowance: breakdown.medicalAllowance,
            grossSalary: breakdown.grossSalary,
          },
        });
      }

      return updated;
    });

    await createAuditLog({
      session,
      action: "EMPLOYEE_UPDATED_BY_HR",
      entityType: "Employee",
      entityId: id,
      details: parsed.data,
    });

    return NextResponse.json({ success: true, employee: result });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
