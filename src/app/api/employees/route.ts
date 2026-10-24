import { NextResponse } from "next/server";
import { getSession, hashPassword, generateTemporaryPassword } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { computeSalaryBreakdown } from "@/lib/tax-calculator";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const createEmployeeSchema = z.object({
  employeeCode: z.string().min(2, "Employee code is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  joiningDate: z.string().optional(),
  basicSalary: z.number().positive("Basic salary must be greater than zero"),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {
    companyId: session.companyId,
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { employmentStatus: status } : {}),
  };

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { employeeCode: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      include: {
        department: true,
        designation: true,
        salaryStructure: true,
        user: { select: { isActive: true, mustChangePassword: true, lastLoginAt: true } },
      },
      orderBy: { employeeCode: "asc" },
    }),
  ]);

  return NextResponse.json({
    employees,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Check duplicate employee code
    const existingCode = await prisma.employee.findUnique({ where: { employeeCode: data.employeeCode } });
    if (existingCode) {
      return NextResponse.json({ error: "An employee with this code already exists" }, { status: 409 });
    }

    const tempPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(tempPassword);
    const breakdown = computeSalaryBreakdown(data.basicSalary);
    const joiningDate = data.joiningDate ? new Date(data.joiningDate) : new Date();

    // Fetch leave types to initialize leave balances
    const leaveTypes = await prisma.leaveType.findMany({
      where: { companyId: auth.session.companyId },
    });

    const currentYear = joiningDate.getFullYear();

    // Transactional creation of User, Employee, SalaryStructure, and LeaveBalances
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "EMPLOYEE",
          isActive: true,
          mustChangePassword: true,
        },
      });

      // 2. Create Employee
      const employee = await tx.employee.create({
        data: {
          companyId: auth.session.companyId,
          userId: user.id,
          employeeCode: data.employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          gender: data.gender || null,
          departmentId: data.departmentId || null,
          designationId: data.designationId || null,
          joiningDate,
          employmentStatus: "ACTIVE",
        },
      });

      // 3. Create SalaryStructure
      await tx.salaryStructure.create({
        data: {
          employeeId: employee.id,
          basicSalary: breakdown.basicSalary,
          hraAllowance: breakdown.hraAllowance,
          medicalAllowance: breakdown.medicalAllowance,
          grossSalary: breakdown.grossSalary,
          effectiveFrom: joiningDate,
        },
      });

      // 4. Initialize Leave Balances
      for (const lt of leaveTypes) {
        if (lt.code !== "UNPAID") {
          await tx.leaveBalance.create({
            data: {
              employeeId: employee.id,
              leaveTypeId: lt.id,
              year: currentYear,
              allocated: lt.yearlyQuota,
              used: 0,
              pending: 0,
            },
          });
        }
      }

      return { employee, user };
    });

    await createAuditLog({
      session,
      action: "EMPLOYEE_REGISTERED",
      entityType: "Employee",
      entityId: result.employee.id,
      details: {
        employeeCode: data.employeeCode,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        basicSalary: data.basicSalary,
      },
    });

    return NextResponse.json({
      success: true,
      employee: result.employee,
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
