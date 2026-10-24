import { prisma } from "@/lib/prisma";

export async function getAdminAnalytics(companyId: string) {
  // 1. Total Active Headcount
  const totalHeadcount = await prisma.employee.count({
    where: { companyId, employmentStatus: "ACTIVE" },
  });

  // 2. YTD Attrition
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(Date.UTC(currentYear, 0, 1));
  const exitsThisYear = await prisma.employee.count({
    where: {
      companyId,
      exitDate: { gte: yearStart },
      employmentStatus: { in: ["TERMINATED", "RESIGNED"] },
    },
  });

  const totalEmpsHistorical = totalHeadcount + exitsThisYear;
  const attritionRate =
    totalEmpsHistorical > 0
      ? Math.round((exitsThisYear / totalEmpsHistorical) * 100 * 10) / 10
      : 0;

  // 3. Monthly Payroll Cost & Average Salary
  const latestPayroll = await prisma.payrollRun.findFirst({
    where: { companyId },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { items: true },
  });

  const totalPayrollCost = latestPayroll ? latestPayroll.totalNet : 0;
  
  const salaries = await prisma.salaryStructure.findMany({
    where: { employee: { companyId, employmentStatus: "ACTIVE" } },
    select: { grossSalary: true },
  });

  const totalGrossSalaries = salaries.reduce((acc, s) => acc + s.grossSalary, 0);
  const averageSalary =
    salaries.length > 0 ? Math.round(totalGrossSalaries / salaries.length) : 0;

  // 4. Headcount by Department
  const departments = await prisma.department.findMany({
    where: { companyId },
    include: {
      employees: {
        where: { employmentStatus: "ACTIVE" },
        include: { salaryStructure: true },
      },
    },
  });

  const departmentAnalytics = departments.map((d) => {
    const count = d.employees.length;
    const deptPayroll = d.employees.reduce(
      (sum, e) => sum + (e.salaryStructure?.grossSalary || 0),
      0
    );
    return {
      departmentId: d.id,
      name: d.name,
      headcount: count,
      payrollCost: Math.round(deptPayroll),
    };
  });

  // 5. Gender Distribution
  const genderGroups = await prisma.employee.groupBy({
    by: ["gender"],
    where: { companyId, employmentStatus: "ACTIVE" },
    _count: { id: true },
  });

  const genderDistribution = genderGroups.map((g) => ({
    gender: g.gender || "Unspecified",
    count: g._count.id,
  }));

  // 6. Recent Audit Activity
  const recentAudits = await prisma.auditLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return {
    totalHeadcount,
    attritionRate,
    exitsThisYear,
    totalPayrollCost,
    averageSalary,
    departmentAnalytics,
    genderDistribution,
    recentAudits,
  };
}

export async function getHrAnalytics(companyId: string, departmentId?: string) {
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrowMidnight = new Date(todayMidnight.getTime() + 86400000);

  const empWhere = {
    companyId,
    employmentStatus: "ACTIVE",
    ...(departmentId ? { departmentId } : {}),
  };

  const totalHeadcount = await prisma.employee.count({ where: empWhere });

  // Today's attendance
  const todayAttendance = await prisma.attendanceRecord.findMany({
    where: {
      date: todayMidnight,
      employee: empWhere,
    },
    include: { employee: true },
  });

  const presentCount = todayAttendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "HALF_DAY"
  ).length;

  const lateCount = todayAttendance.filter((a) => a.status === "LATE").length;

  // On leave today
  const onLeaveToday = await prisma.leaveRequest.count({
    where: {
      status: "APPROVED",
      startDate: { lte: now },
      endDate: { gte: now },
      employee: empWhere,
    },
  });

  // Pending Approvals
  const pendingLeaves = await prisma.leaveRequest.count({
    where: {
      status: "PENDING",
      employee: { companyId },
    },
  });

  const pendingCorrections = await prisma.attendanceCorrection.count({
    where: {
      status: "PENDING",
      employee: { companyId },
    },
  });

  const totalPendingApprovals = pendingLeaves + pendingCorrections;

  // Attendance Trends: Last 7 days
  const sevenDaysAgo = new Date(todayMidnight.getTime() - 6 * 86400000);
  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: {
      date: { gte: sevenDaysAgo, lte: todayMidnight },
      employee: empWhere,
    },
  });

  // Group by date
  const trendMap = new Map<string, { date: string; present: number; late: number; absent: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 86400000);
    const dateStr = d.toISOString().split("T")[0];
    trendMap.set(dateStr, { date: dateStr, present: 0, late: 0, absent: 0 });
  }

  for (const record of recentAttendance) {
    const dateStr = new Date(record.date).toISOString().split("T")[0];
    const item = trendMap.get(dateStr);
    if (item) {
      if (record.status === "LATE") {
        item.late++;
        item.present++;
      } else if (record.status === "PRESENT" || record.status === "HALF_DAY") {
        item.present++;
      } else if (record.status === "ABSENT") {
        item.absent++;
      }
    }
  }

  const attendanceTrends = Array.from(trendMap.values());

  // Top 5 Late-Comers this month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lateRecordsThisMonth = await prisma.attendanceRecord.groupBy({
    by: ["employeeId"],
    where: {
      date: { gte: monthStart },
      status: "LATE",
      employee: empWhere,
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const topLateComers = await Promise.all(
    lateRecordsThisMonth.map(async (l) => {
      const emp = await prisma.employee.findUnique({
        where: { id: l.employeeId },
        include: { department: true },
      });
      return {
        employeeId: l.employeeId,
        employeeCode: emp?.employeeCode || "",
        name: `${emp?.firstName} ${emp?.lastName}`,
        department: emp?.department?.name || "Unassigned",
        lateCount: l._count.id,
      };
    })
  );

  // Leave Utilization by Type
  const leaveTypes = await prisma.leaveType.findMany({
    where: { companyId },
    include: {
      leaveRequests: {
        where: {
          status: "APPROVED",
          startDate: { gte: monthStart },
          employee: empWhere,
        },
      },
    },
  });

  const leaveUtilization = leaveTypes.map((t) => ({
    type: t.name,
    daysUsed: t.leaveRequests.reduce((sum, r) => sum + r.daysCount, 0),
    quota: t.yearlyQuota,
  }));

  return {
    totalHeadcount,
    presentToday: presentCount,
    onLeaveToday,
    lateArrivalsToday: lateCount,
    totalPendingApprovals,
    pendingLeaves,
    pendingCorrections,
    attendanceTrends,
    topLateComers,
    leaveUtilization,
  };
}

export async function getEmployeeAnalytics(employeeId: string) {
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // 1. Today's attendance
  const todayAttendance = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId,
        date: todayMidnight,
      },
    },
  });

  // 2. Weekly Hours vs 40h reference
  // Start of current week (Monday)
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const mondayMidnight = new Date(todayMidnight.getTime() - diffToMonday * 86400000);

  const weekRecords = await prisma.attendanceRecord.findMany({
    where: {
      employeeId,
      date: { gte: mondayMidnight, lte: todayMidnight },
    },
  });

  const weeklyWorkedHours = weekRecords.reduce((sum, r) => sum + (r.workedHours || 0), 0);
  const roundedWeeklyHours = Math.round(weeklyWorkedHours * 10) / 10;

  // 3. Late count this month
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lateCountThisMonth = await prisma.attendanceRecord.count({
    where: {
      employeeId,
      date: { gte: monthStart },
      status: "LATE",
    },
  });

  // 4. Remaining Leave Balances
  const currentYear = now.getFullYear();
  const leaveBalances = await prisma.leaveBalance.findMany({
    where: { employeeId, year: currentYear },
    include: { leaveType: true },
  });

  const leaveSummary = leaveBalances.map((b) => ({
    leaveTypeId: b.leaveTypeId,
    name: b.leaveType.name,
    code: b.leaveType.code,
    allocated: b.allocated,
    used: b.used,
    pending: b.pending,
    available: Math.max(0, b.allocated - b.used - b.pending),
  }));

  // 5. Latest Payslip
  const latestPayslip = await prisma.payrollItem.findFirst({
    where: {
      employeeId,
      payrollRun: { status: "FINALIZED" },
    },
    orderBy: { createdAt: "desc" },
    include: { payrollRun: true },
  });

  return {
    todayAttendance,
    weeklyHours: roundedWeeklyHours,
    standardHours: 40,
    lateCountThisMonth,
    leaveSummary,
    latestPayslip,
  };
}
