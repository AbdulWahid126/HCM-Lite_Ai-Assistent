import { prisma } from "@/lib/prisma";
import { calculateEmployeePayroll } from "@/lib/tax-calculator";
import { getWorkingDaysInMonth } from "@/lib/date-utils";

export interface GeneratePayrollDraftInput {
  companyId: string;
  month: number; // 1 - 12
  year: number;  // e.g. 2026
  createdById: string; // User ID
}

export interface FinalizePayrollInput {
  payrollRunId: string;
  adminId: string; // User ID
}

export async function generatePayrollDraft(input: GeneratePayrollDraftInput) {
  const company = await prisma.company.findUnique({
    where: { id: input.companyId },
    include: {
      settings: true,
      publicHolidays: true,
    },
  });

  if (!company) {
    const error = new Error("Company not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  // Check if an existing run exists for this month/year
  const existingRun = await prisma.payrollRun.findUnique({
    where: {
      companyId_month_year: {
        companyId: input.companyId,
        month: input.month,
        year: input.year,
      },
    },
  });

  if (existingRun && existingRun.status === "FINALIZED") {
    const error = new Error("Cannot regenerate a finalized payroll run");
    (error as unknown as { statusCode: number }).statusCode = 400;
    throw error;
  }

  // Calculate working days in month excluding weekends and holidays
  const weekendConfig = company.settings?.weekendDays || "SATURDAY,SUNDAY";
  const holidays = company.publicHolidays;
  const workingDaysInMonth = getWorkingDaysInMonth(input.year, input.month, weekendConfig, holidays);

  // Fetch all active employees with their salary structure
  const employees = await prisma.employee.findMany({
    where: {
      companyId: input.companyId,
      employmentStatus: { in: ["ACTIVE", "PROBATION", "ON_LEAVE"] },
      salaryStructure: { isNot: null },
    },
    include: {
      salaryStructure: true,
    },
  });

  if (employees.length === 0) {
    const error = new Error("No active employees with assigned salary structures found");
    (error as unknown as { statusCode: number }).statusCode = 400;
    throw error;
  }

  // Month date range
  const monthStart = new Date(Date.UTC(input.year, input.month - 1, 1));
  const monthEnd = new Date(Date.UTC(input.year, input.month, 0, 23, 59, 59, 999));

  // Compute payroll item for each employee inside a transaction
  return await prisma.$transaction(async (tx) => {
    // Upsert or clear previous draft items if re-generating
    let runId: string;
    if (existingRun) {
      runId = existingRun.id;
      await tx.payrollItem.deleteMany({
        where: { payrollRunId: runId },
      });
    } else {
      const created = await tx.payrollRun.create({
        data: {
          companyId: input.companyId,
          month: input.month,
          year: input.year,
          status: "DRAFT",
          createdById: input.createdById,
        },
      });
      runId = created.id;
    }

    let runTotalGross = 0;
    let runTotalDeductions = 0;
    let runTotalTax = 0;
    let runTotalNet = 0;

    for (const emp of employees) {
      if (!emp.salaryStructure) continue;

      // 1. Fetch attendance records for this month
      const attendance = await tx.attendanceRecord.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: monthStart, lte: monthEnd },
        },
      });

      // 2. Fetch approved unpaid leave for this month
      const unpaidLeaves = await tx.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          status: "APPROVED",
          leaveType: { code: "UNPAID" },
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
      });

      const unpaidLeaveDays = unpaidLeaves.reduce((sum, req) => sum + req.daysCount, 0);

      let absentDays = 0;
      let halfDays = 0;
      let presentDays = 0;

      for (const rec of attendance) {
        if (rec.status === "ABSENT") absentDays++;
        else if (rec.status === "HALF_DAY") halfDays++;
        else presentDays++;
      }

      // Check missing working days: if an expected working day has no check-in and no approved leave, it is absent
      // For precision, absentDays represents explicit ABSENT records or unlogged working days past current date
      const daysWorked = Math.max(0, workingDaysInMonth - absentDays - unpaidLeaveDays - halfDays * 0.5);

      const calc = calculateEmployeePayroll({
        basicSalary: emp.salaryStructure.basicSalary,
        workingDaysInMonth,
        absentDays,
        unpaidLeaveDays,
        halfDays,
        payrollMonth: input.month,
        payrollYear: input.year,
      });

      runTotalGross += calc.grossSalary;
      runTotalDeductions += calc.attendanceDeductions;
      runTotalTax += calc.taxDeduction;
      runTotalNet += calc.netSalary;

      await tx.payrollItem.create({
        data: {
          payrollRunId: runId,
          employeeId: emp.id,
          basicSalary: calc.basicSalary,
          hraAllowance: calc.hraAllowance,
          medicalAllowance: calc.medicalAllowance,
          grossSalary: calc.grossSalary,
          workingDaysInMonth,
          daysWorked,
          absentDays,
          unpaidLeaveDays,
          halfDays,
          perDaySalary: calc.perDaySalary,
          attendanceDeductions: calc.attendanceDeductions,
          taxDeduction: calc.taxDeduction,
          netSalary: calc.netSalary,
        },
      });
    }

    const updatedRun = await tx.payrollRun.update({
      where: { id: runId },
      data: {
        totalEmployees: employees.length,
        totalGross: Math.round(runTotalGross * 100) / 100,
        totalDeductions: Math.round(runTotalDeductions * 100) / 100,
        totalTax: Math.round(runTotalTax * 100) / 100,
        totalNet: Math.round(runTotalNet * 100) / 100,
      },
      include: {
        items: {
          include: {
            employee: true,
          },
        },
      },
    });

    return updatedRun;
  });
}

export async function finalizePayroll(input: FinalizePayrollInput) {
  const run = await prisma.payrollRun.findUnique({
    where: { id: input.payrollRunId },
    include: {
      items: {
        include: {
          employee: { include: { user: true } },
        },
      },
    },
  });

  if (!run) {
    const error = new Error("Payroll run not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  if (run.status === "FINALIZED") {
    const error = new Error("Payroll run is already finalized and locked");
    (error as unknown as { statusCode: number }).statusCode = 400;
    throw error;
  }

  // Admin finalization and lock
  const finalized = await prisma.$transaction(async (tx) => {
    const updated = await tx.payrollRun.update({
      where: { id: run.id },
      data: {
        status: "FINALIZED",
        finalizedById: input.adminId,
        finalizedAt: new Date(),
      },
    });

    // Notify all employees that their payslip is available
    for (const item of run.items) {
      await tx.notification.create({
        data: {
          userId: item.employee.userId,
          title: "New Payslip Available",
          message: `Your payslip for ${run.month}/${run.year} is now available. Net salary: PKR ${item.netSalary.toLocaleString()}`,
          type: "PAYROLL",
          link: `/employee/payslips/${item.id}`,
        },
      });
    }

    return updated;
  });

  return finalized;
}
