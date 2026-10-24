import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const setupSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  adminEmail: z.string().email("Valid email required"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  officeStartTime: z.string().default("09:00"),
  gracePeriodMins: z.number().default(15),
  weekendDays: z.string().default("SATURDAY,SUNDAY"),
  officeLatitude: z.number().optional().default(24.8607),
  officeLongitude: z.number().optional().default(67.0011),
  geofenceRadius: z.number().optional().default(150),
});

export async function GET() {
  const companyCount = await prisma.company.count();
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return NextResponse.json({
    isSetupNeeded: companyCount === 0 || adminCount === 0,
    companyCount,
    adminCount,
  });
}

export async function POST(req: Request) {
  try {
    const existingCompany = await prisma.company.findFirst();
    if (existingCompany) {
      const adminExists = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      if (adminExists) {
        return NextResponse.json(
          { error: "Setup has already been completed for this organization." },
          { status: 400 }
        );
      }
    }

    const body = await req.json();
    const parsed = setupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Use transaction to create Company, OrgSettings, Default Leave Types, Default Departments, and Admin User
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Company
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          email: data.adminEmail,
        },
      });

      // 2. Create Org Settings
      await tx.orgSettings.create({
        data: {
          companyId: company.id,
          officeStartTime: data.officeStartTime,
          gracePeriodMins: data.gracePeriodMins,
          weekendDays: data.weekendDays,
          officeLatitude: data.officeLatitude,
          officeLongitude: data.officeLongitude,
          geofenceRadius: data.geofenceRadius,
        },
      });

      // 3. Create Default Leave Types per brief
      // Annual: 14, Sick: 8, Casual: 10, Unpaid: unlimited (0 quota)
      await tx.leaveType.createMany({
        data: [
          { companyId: company.id, name: "Annual Leave", code: "ANNUAL", yearlyQuota: 14, isPaid: true },
          { companyId: company.id, name: "Sick Leave", code: "SICK", yearlyQuota: 8, isPaid: true },
          { companyId: company.id, name: "Casual Leave", code: "CASUAL", yearlyQuota: 10, isPaid: true },
          { companyId: company.id, name: "Unpaid Leave", code: "UNPAID", yearlyQuota: 0, isPaid: false },
        ],
      });

      // 4. Create Standard Departments
      const engineering = await tx.department.create({
        data: { companyId: company.id, name: "Engineering", code: "ENG" },
      });
      const hrDept = await tx.department.create({
        data: { companyId: company.id, name: "Human Resources", code: "HR" },
      });
      await tx.department.create({
        data: { companyId: company.id, name: "Finance", code: "FIN" },
      });

      // 5. Create Standard Designations
      await tx.designation.createMany({
        data: [
          { companyId: company.id, departmentId: engineering.id, title: "Senior Software Engineer" },
          { companyId: company.id, departmentId: engineering.id, title: "Full Stack Engineer" },
          { companyId: company.id, departmentId: hrDept.id, title: "HR Manager" },
          { companyId: company.id, departmentId: hrDept.id, title: "HR Specialist" },
        ],
      });

      // 6. Create Admin User
      const passwordHash = await hashPassword(data.adminPassword);
      const adminUser = await tx.user.create({
        data: {
          email: data.adminEmail,
          passwordHash,
          role: "ADMIN",
          isActive: true,
          mustChangePassword: false,
        },
      });

      return { company, adminUser };
    });

    await createAuditLog({
      actorEmail: data.adminEmail,
      actorRole: "ADMIN",
      action: "COMPANY_INITIALIZED",
      entityType: "Company",
      entityId: result.company.id,
      details: { companyName: data.companyName, adminEmail: data.adminEmail },
    });

    return NextResponse.json({
      success: true,
      message: "Company and Admin account successfully initialized.",
      companyId: result.company.id,
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Internal server error during company setup" },
      { status: 500 }
    );
  }
}
