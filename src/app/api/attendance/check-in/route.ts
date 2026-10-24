import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { processCheckIn } from "@/server/services/attendance";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const checkInSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  faceVerified: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 });
  }

  if (!session.employeeId) {
    return NextResponse.json({ error: "No associated employee record found for this user account" }, { status: 400 });
  }

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const parsed = checkInSchema.safeParse(body);
    const data = parsed.success ? parsed.data : {};

    const record = await processCheckIn({
      employeeId: session.employeeId,
      latitude: data.latitude,
      longitude: data.longitude,
      faceVerified: data.faceVerified,
    });

    await createAuditLog({
      session,
      action: "ATTENDANCE_CHECKED_IN",
      entityType: "AttendanceRecord",
      entityId: record.id,
      details: {
        status: record.status,
        checkInTime: record.checkIn,
        withinGeofence: record.withinGeofence,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Check-in recorded successfully at ${new Date(record.checkIn).toLocaleTimeString()}`,
      record,
    });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "DUPLICATE_CHECK_IN" || err.message === "ALREADY_CHECKED_IN") {
      return NextResponse.json(
        { error: "You have already checked in for today." },
        { status: 409 } // HTTP 409 Conflict per brief
      );
    }
    console.error("Check-in error:", error);
    return NextResponse.json({ error: "Internal server error during check-in" }, { status: 500 });
  }
}
