import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { isWeekend, isPublicHoliday } from "@/lib/date-utils";

export async function GET(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const departmentId = searchParams.get("departmentId") || "";

  const targetDate = new Date(dateStr);
  const dateMidnight = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

  // Fetch company settings & holidays to evaluate if it's a working day
  const company = await prisma.company.findUnique({
    where: { id: auth.session.companyId },
    include: { settings: true, publicHolidays: true },
  });

  const weekendConfig = company?.settings?.weekendDays || "SATURDAY,SUNDAY";
  const holidays = company?.publicHolidays || [];
  const isOffDay = isWeekend(dateMidnight, weekendConfig) || isPublicHoliday(dateMidnight, holidays);

  // Fetch employees
  const employees = await prisma.employee.findMany({
    where: {
      companyId: auth.session.companyId,
      employmentStatus: "ACTIVE",
      ...(departmentId ? { departmentId } : {}),
    },
    include: {
      department: true,
      designation: true,
      attendanceRecords: {
        where: { date: dateMidnight },
      },
      leaveRequests: {
        where: {
          status: "APPROVED",
          startDate: { lte: dateMidnight },
          endDate: { gte: dateMidnight },
        },
        include: { leaveType: true },
      },
    },
    orderBy: { employeeCode: "asc" },
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const isPastDay = dateStr < todayStr;

  const boardItems = employees.map((emp) => {
    const attendance = emp.attendanceRecords[0] || null;
    const leave = emp.leaveRequests[0] || null;

    let computedStatus = "NOT_RECORDED";
    if (leave) {
      computedStatus = "ON_LEAVE";
    } else if (attendance) {
      if (!attendance.checkOut && isPastDay) {
        computedStatus = "MISSING_CHECKOUT";
      } else {
        computedStatus = attendance.status;
      }
    } else if (isOffDay) {
      computedStatus = "WEEKEND_OR_HOLIDAY";
    } else if (isPastDay) {
      computedStatus = "ABSENT";
    }

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department?.name || "Unassigned",
      designation: emp.designation?.title || "Unassigned",
      status: computedStatus,
      checkIn: attendance?.checkIn || null,
      checkOut: attendance?.checkOut || null,
      workedHours: attendance?.workedHours || 0,
      withinGeofence: attendance?.withinGeofence ?? null,
      leaveType: leave?.leaveType?.name || null,
    };
  });

  const summary = {
    total: boardItems.length,
    present: boardItems.filter((i) => ["PRESENT", "LATE", "HALF_DAY"].includes(i.status)).length,
    late: boardItems.filter((i) => i.status === "LATE").length,
    onLeave: boardItems.filter((i) => i.status === "ON_LEAVE").length,
    absent: boardItems.filter((i) => i.status === "ABSENT").length,
    missingCheckout: boardItems.filter((i) => i.status === "MISSING_CHECKOUT").length,
  };

  return NextResponse.json({
    date: dateStr,
    isOffDay,
    summary,
    records: boardItems,
  });
}
