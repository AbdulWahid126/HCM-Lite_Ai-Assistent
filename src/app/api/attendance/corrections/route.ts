import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/server/services/audit";
import { z } from "zod";

const createCorrectionSchema = z.object({
  date: z.string().min(10, "Date is required (YYYY-MM-DD)"),
  requestedCheckIn: z.string().optional(),
  requestedCheckOut: z.string().optional(),
  reason: z.string().min(5, "Reason is required (min 5 characters)"),
});

const reviewCorrectionSchema = z.object({
  correctionId: z.string(),
  action: z.enum(["APPROVE", "REJECT"]),
  reviewerComments: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  if (session.role === "EMPLOYEE") {
    const corrections = await prisma.attendanceCorrection.findMany({
      where: { employeeId: session.employeeId! },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(corrections);
  }

  // HR / Admin: view all
  const corrections = await prisma.attendanceCorrection.findMany({
    where: {
      status,
      employee: { companyId: session.companyId },
    },
    include: {
      employee: {
        include: { department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(corrections);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.employeeId) {
    return NextResponse.json({ error: "Unauthorized: Employee profile required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createCorrectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { date, requestedCheckIn, requestedCheckOut, reason } = parsed.data;
    const targetDate = new Date(date);
    const dateMidnight = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate()));

    const checkInDate = requestedCheckIn ? new Date(requestedCheckIn) : null;
    const checkOutDate = requestedCheckOut ? new Date(requestedCheckOut) : null;

    const correction = await prisma.attendanceCorrection.create({
      data: {
        employeeId: session.employeeId,
        date: dateMidnight,
        requestedCheckIn: checkInDate,
        requestedCheckOut: checkOutDate,
        reason,
        status: "PENDING",
      },
    });

    await createAuditLog({
      session,
      action: "ATTENDANCE_CORRECTION_REQUESTED",
      entityType: "AttendanceCorrection",
      entityId: correction.id,
      details: { date, reason },
    });

    return NextResponse.json({ success: true, correction }, { status: 201 });
  } catch (error) {
    console.error("Attendance correction request error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const parsed = reviewCorrectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { correctionId, action, reviewerComments } = parsed.data;

    const correction = await prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
      include: {
        employee: {
          include: {
            user: true,
            company: { include: { settings: true } },
          },
        },
      },
    });

    if (!correction) {
      return NextResponse.json({ error: "Correction request not found" }, { status: 404 });
    }

    if (correction.status !== "PENDING") {
      return NextResponse.json({ error: `Request has already been ${correction.status.toLowerCase()}` }, { status: 400 });
    }

    if (action === "APPROVE") {
      await prisma.$transaction(async (tx) => {
        // Update correction request
        await tx.attendanceCorrection.update({
          where: { id: correctionId },
          data: {
            status: "APPROVED",
            reviewedById: auth.session.userId,
            reviewedAt: new Date(),
            reviewerComments: reviewerComments || "Approved by HR",
          },
        });

        // Compute worked hours
        let workedHours = 8.0;
        if (correction.requestedCheckIn && correction.requestedCheckOut) {
          const inMs = new Date(correction.requestedCheckIn).getTime();
          const outMs = new Date(correction.requestedCheckOut).getTime();
          workedHours = Math.round(((outMs - inMs) / (1000 * 60 * 60)) * 100) / 100;
        }

        const halfDayHours = correction.employee.company.settings?.halfDayHours ?? 5.0;
        const newStatus = workedHours < halfDayHours ? "HALF_DAY" : "PRESENT";

        // Upsert actual attendance record
        await tx.attendanceRecord.upsert({
          where: {
            employeeId_date: {
              employeeId: correction.employeeId,
              date: correction.date,
            },
          },
          create: {
            employeeId: correction.employeeId,
            date: correction.date,
            checkIn: correction.requestedCheckIn || new Date(correction.date),
            checkOut: correction.requestedCheckOut || new Date(correction.date),
            workedHours,
            status: newStatus,
            notes: `Correction approved: ${correction.reason}`,
          },
          update: {
            checkIn: correction.requestedCheckIn || undefined,
            checkOut: correction.requestedCheckOut || undefined,
            workedHours,
            status: newStatus,
            notes: `Correction approved: ${correction.reason}`,
          },
        });

        // Notify employee
        await tx.notification.create({
          data: {
            userId: correction.employee.userId,
            title: "Attendance Correction Approved",
            message: `Your correction request for ${new Date(correction.date).toLocaleDateString()} has been approved.`,
            type: "ATTENDANCE",
          },
        });
      });
    } else {
      // REJECT
      await prisma.$transaction(async (tx) => {
        await tx.attendanceCorrection.update({
          where: { id: correctionId },
          data: {
            status: "REJECTED",
            reviewedById: auth.session.userId,
            reviewedAt: new Date(),
            reviewerComments: reviewerComments || "Rejected by HR",
          },
        });

        await tx.notification.create({
          data: {
            userId: correction.employee.userId,
            title: "Attendance Correction Rejected",
            message: `Your correction request for ${new Date(correction.date).toLocaleDateString()} was rejected. Reason: ${reviewerComments || "No comment provided."}`,
            type: "ATTENDANCE",
          },
        });
      });
    }

    await createAuditLog({
      session: auth.session,
      action: `ATTENDANCE_CORRECTION_${action}D`,
      entityType: "AttendanceCorrection",
      entityId: correctionId,
      details: { action, reviewerComments },
    });

    return NextResponse.json({ success: true, status: `${action}D` });
  } catch (error) {
    console.error("Review correction error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
