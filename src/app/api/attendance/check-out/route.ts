import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processCheckOut } from "@/server/services/attendance";
import { createAuditLog } from "@/server/services/audit";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
  }

  if (!session.employeeId) {
    return NextResponse.json({ error: "No associated employee record found" }, { status: 400 });
  }

  try {
    const record = await processCheckOut({
      employeeId: session.employeeId,
    });

    await createAuditLog({
      session,
      action: "ATTENDANCE_CHECKED_OUT",
      entityType: "AttendanceRecord",
      entityId: record.id,
      details: {
        checkOutTime: record.checkOut,
        workedHours: record.workedHours,
        status: record.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Check-out recorded. Total worked: ${record.workedHours} hours.`,
      record,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err.message === "NO_CHECK_IN_FOUND") {
      return NextResponse.json({ error: "No check-in record found for today." }, { status: 400 });
    }
    if (err.message === "ALREADY_CHECKED_OUT") {
      return NextResponse.json({ error: "You have already checked out for today." }, { status: 400 });
    }
    console.error("Check-out error:", error);
    return NextResponse.json({ error: "Internal server error during check-out" }, { status: 500 });
  }
}
