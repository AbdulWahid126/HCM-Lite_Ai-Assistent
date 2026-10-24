import { NextResponse } from "next/server";
import { getSession, hashPassword, generateTemporaryPassword } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { computeSalaryBreakdown } from "@/lib/tax-calculator";
import { createAuditLog } from "@/server/services/audit";
import Papa from "papaparse";

export interface CsvValidationIssue {
  row: number;
  field: string;
  reason: string;
  value?: unknown;
}

export async function POST(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isDryRun = formData.get("dryRun") === "true";

    if (!file) {
      return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: "Failed to parse CSV file", details: parsed.errors }, { status: 400 });
    }

    const rows = parsed.data;
    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
    }

    if (rows.length > 1000) {
      return NextResponse.json({ error: "Maximum 1,000 records allowed per import" }, { status: 400 });
    }

    // Pre-fetch departments, existing codes, and emails
    const [departments, existingUsers, existingEmployees, leaveTypes] = await Promise.all([
      prisma.department.findMany({ where: { companyId: auth.session.companyId } }),
      prisma.user.findMany({ select: { email: true } }),
      prisma.employee.findMany({ where: { companyId: auth.session.companyId }, select: { employeeCode: true, email: true } }),
      prisma.leaveType.findMany({ where: { companyId: auth.session.companyId } }),
    ]);

    const deptMap = new Map<string, string>();
    departments.forEach((d) => deptMap.set(d.name.toLowerCase(), d.id));

    const existingEmails = new Set<string>();
    existingUsers.forEach((u) => existingEmails.add(u.email.toLowerCase()));
    existingEmployees.forEach((e) => existingEmails.add(e.email.toLowerCase()));

    const existingCodes = new Set<string>();
    existingEmployees.forEach((e) => existingCodes.add(e.employeeCode.toUpperCase()));

    const issues: CsvValidationIssue[] = [];
    const validRows: Array<{
      employeeCode: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      address?: string;
      departmentId?: string;
      basicSalary: number;
      joiningDate: Date;
    }> = [];

    // Track duplicates within the CSV itself
    const csvEmails = new Set<string>();
    const csvCodes = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const code = (row["Employee Code"] || row["employeeCode"] || row["code"] || "").trim().toUpperCase();
      const firstName = (row["First Name"] || row["firstName"] || "").trim();
      const lastName = (row["Last Name"] || row["lastName"] || "").trim();
      const email = (row["Email"] || row["email"] || "").trim().toLowerCase();
      const deptName = (row["Department"] || row["department"] || "").trim();
      const salaryStr = (row["Basic Salary"] || row["basicSalary"] || row["salary"] || "").trim();
      const dateStr = (row["Joining Date"] || row["joiningDate"] || "").trim();

      // Validate Employee Code
      if (!code) {
        issues.push({ row: rowNum, field: "employeeCode", reason: "Employee code is required" });
      } else if (existingCodes.has(code) || csvCodes.has(code)) {
        issues.push({ row: rowNum, field: "employeeCode", reason: "Duplicate employee code", value: code });
      }

      // Validate Names
      if (!firstName) {
        issues.push({ row: rowNum, field: "firstName", reason: "First name is required" });
      }
      if (!lastName) {
        issues.push({ row: rowNum, field: "lastName", reason: "Last name is required" });
      }

      // Validate Email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        issues.push({ row: rowNum, field: "email", reason: "Valid email address is required", value: email });
      } else if (existingEmails.has(email) || csvEmails.has(email)) {
        issues.push({ row: rowNum, field: "email", reason: "Duplicate email address", value: email });
      }

      // Validate Salary
      const basicSalary = parseFloat(salaryStr);
      if (isNaN(basicSalary) || basicSalary <= 0) {
        issues.push({ row: rowNum, field: "basicSalary", reason: "Basic salary must be a positive number", value: salaryStr });
      }

      // Validate Department
      let departmentId: string | undefined = undefined;
      if (deptName) {
        departmentId = deptMap.get(deptName.toLowerCase());
        if (!departmentId) {
          issues.push({ row: rowNum, field: "department", reason: `Department '${deptName}' not found`, value: deptName });
        }
      }

      // Validate Joining Date
      let joiningDate = new Date();
      if (dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) {
          issues.push({ row: rowNum, field: "joiningDate", reason: "Invalid joining date format (use YYYY-MM-DD)", value: dateStr });
        } else {
          joiningDate = d;
        }
      }

      if (issues.filter((i) => i.row === rowNum).length === 0) {
        csvEmails.add(email);
        csvCodes.add(code);
        validRows.push({
          employeeCode: code,
          firstName,
          lastName,
          email,
          phone: row["Phone"] || row["phone"] || undefined,
          address: row["Address"] || row["address"] || undefined,
          departmentId,
          basicSalary,
          joiningDate,
        });
      }
    });

    const report = {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: rows.length - validRows.length,
      issues,
      isDryRun,
    };

    // If dry run, return report only
    if (isDryRun) {
      return NextResponse.json({ success: true, report });
    }

    // If there are validation errors during a real import, reject with clear details
    if (issues.length > 0) {
      return NextResponse.json(
        {
          error: "Validation errors encountered. No records were imported.",
          report,
        },
        { status: 422 }
      );
    }

    // Execute transactional import
    let importedCount = 0;
    const currentYear = new Date().getFullYear();

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        const tempPassword = generateTemporaryPassword();
        const passwordHash = await hashPassword(tempPassword);
        const breakdown = computeSalaryBreakdown(row.basicSalary);

        // 1. Create User
        const user = await tx.user.create({
          data: {
            email: row.email,
            passwordHash,
            role: "EMPLOYEE",
            isActive: true,
            mustChangePassword: true,
          },
        });

        // 2. Create Employee
        const emp = await tx.employee.create({
          data: {
            companyId: auth.session.companyId,
            userId: user.id,
            employeeCode: row.employeeCode,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            phone: row.phone || null,
            address: row.address || null,
            departmentId: row.departmentId || null,
            joiningDate: row.joiningDate,
            employmentStatus: "ACTIVE",
          },
        });

        // 3. Create SalaryStructure
        await tx.salaryStructure.create({
          data: {
            employeeId: emp.id,
            basicSalary: breakdown.basicSalary,
            hraAllowance: breakdown.hraAllowance,
            medicalAllowance: breakdown.medicalAllowance,
            grossSalary: breakdown.grossSalary,
            effectiveFrom: row.joiningDate,
          },
        });

        // 4. Leave balances
        for (const lt of leaveTypes) {
          if (lt.code !== "UNPAID") {
            await tx.leaveBalance.create({
              data: {
                employeeId: emp.id,
                leaveTypeId: lt.id,
                year: currentYear,
                allocated: lt.yearlyQuota,
                used: 0,
                pending: 0,
              },
            });
          }
        }

        importedCount++;
      }
    });

    await createAuditLog({
      session,
      action: "EMPLOYEES_IMPORTED_CSV",
      entityType: "Employee",
      details: { importedCount, filename: file.name },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} employees.`,
      report,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Internal server error during CSV import" }, { status: 500 });
  }
}
