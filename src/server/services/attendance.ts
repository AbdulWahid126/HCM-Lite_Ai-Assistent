import { prisma } from "@/lib/prisma";
import { isWeekend, isPublicHoliday, calculateHaversineDistance } from "@/lib/date-utils";

export interface CheckInOptions {
  employeeId: string;
  latitude?: number;
  longitude?: number;
  faceVerified?: boolean;
}

export interface CheckOutOptions {
  employeeId: string;
}

export async function processCheckIn(options: CheckInOptions) {
  const employee = await prisma.employee.findUnique({
    where: { id: options.employeeId },
    include: {
      company: {
        include: { settings: true },
      },
    },
  });

  if (!employee) {
    throw new Error("EMPLOYEE_NOT_FOUND");
  }

  const now = new Date();
  // Midnight UTC of today
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Check if attendance record already exists for today
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId: options.employeeId,
        date: todayMidnight,
      },
    },
  });

  if (existing) {
    const error = new Error("ALREADY_CHECKED_IN");
    (error as unknown as { code: string }).code = "DUPLICATE_CHECK_IN";
    throw error;
  }

  // Determine late status based on company settings
  const settings = employee.company.settings;
  const officeStartTime = settings?.officeStartTime || "09:00";
  const graceMins = settings?.gracePeriodMins ?? 15;

  const [startHourStr, startMinStr] = officeStartTime.split(":");
  const thresholdMinutes = parseInt(startHourStr, 10) * 60 + parseInt(startMinStr, 10) + graceMins;
  
  // Calculate local minutes for current time
  // If timezone is PKT (UTC+5), let's ensure local hour conversion:
  const localHours = (now.getUTCHours() + 5) % 24;
  const currentMinutes = localHours * 60 + now.getUTCMinutes();

  const isLate = currentMinutes > thresholdMinutes;
  const initialStatus = isLate ? "LATE" : "PRESENT";

  // Geofence check
  let withinGeofence = true;
  let distanceMeters = 0;
  if (
    options.latitude !== undefined &&
    options.longitude !== undefined &&
    settings?.officeLatitude &&
    settings?.officeLongitude
  ) {
    distanceMeters = calculateHaversineDistance(
      options.latitude,
      options.longitude,
      settings.officeLatitude,
      settings.officeLongitude
    );
    withinGeofence = distanceMeters <= (settings.geofenceRadius || 150);
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: options.employeeId,
      date: todayMidnight,
      checkIn: now,
      status: initialStatus,
      checkInLatitude: options.latitude,
      checkInLongitude: options.longitude,
      distanceMeters,
      withinGeofence,
      faceVerified: options.faceVerified ?? false,
    },
  });

  return record;
}

export async function processCheckOut(options: CheckOutOptions) {
  const now = new Date();
  const todayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const record = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_date: {
        employeeId: options.employeeId,
        date: todayMidnight,
      },
    },
    include: {
      employee: {
        include: {
          company: { include: { settings: true } },
        },
      },
    },
  });

  if (!record) {
    throw new Error("NO_CHECK_IN_FOUND");
  }

  if (record.checkOut) {
    throw new Error("ALREADY_CHECKED_OUT");
  }

  const checkInTime = new Date(record.checkIn).getTime();
  const checkOutTime = now.getTime();
  const workedHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100;

  const halfDayThreshold = record.employee.company.settings?.halfDayHours ?? 5.0;
  let finalStatus = record.status;

  if (workedHours < halfDayThreshold) {
    finalStatus = "HALF_DAY";
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: record.id },
    data: {
      checkOut: now,
      workedHours,
      status: finalStatus,
    },
  });

  return updated;
}
