import { prisma } from "@/lib/prisma";
import { calculateWorkingDays } from "@/lib/date-utils";

export interface ApplyLeaveInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export interface ReviewLeaveInput {
  leaveRequestId: string;
  action: "APPROVE" | "REJECT";
  reviewerId: string; // User ID
  comment?: string;
}

export async function applyForLeave(input: ApplyLeaveInput) {
  const start = new Date(input.startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(input.endDate);
  end.setHours(0, 0, 0, 0);

  if (end < start) {
    const error = new Error("End date cannot be earlier than start date");
    (error as unknown as { statusCode: number }).statusCode = 422;
    throw error;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    include: {
      company: {
        include: {
          settings: true,
          publicHolidays: true,
        },
      },
    },
  });

  if (!employee) {
    const error = new Error("Employee not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  const leaveType = await prisma.leaveType.findUnique({
    where: { id: input.leaveTypeId },
  });

  if (!leaveType) {
    const error = new Error("Leave type not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  // 1. Calculate working days excluding configured weekends and holidays
  const weekendConfig = employee.company.settings?.weekendDays || "SATURDAY,SUNDAY";
  const holidays = employee.company.publicHolidays;
  const daysCount = calculateWorkingDays(start, end, weekendConfig, holidays);

  if (daysCount <= 0) {
    const error = new Error("Selected dates fall entirely on weekends or holidays");
    (error as unknown as { statusCode: number }).statusCode = 422;
    throw error;
  }

  // 2. Check for overlapping leave requests (excluding REJECTED and CANCELLED)
  const overlapping = await prisma.leaveRequest.findFirst({
    where: {
      employeeId: input.employeeId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      ],
    },
  });

  if (overlapping) {
    const error = new Error("You already have an existing or pending leave request covering these dates");
    (error as unknown as { statusCode: number }).statusCode = 422;
    throw error;
  }

  // 3. Balance verification for paid leave types
  const currentYear = start.getFullYear();
  if (leaveType.code !== "UNPAID") {
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: currentYear,
        },
      },
    });

    // If balance record doesn't exist yet, initialize it from quota
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          year: currentYear,
          allocated: leaveType.yearlyQuota,
          used: 0,
          pending: 0,
        },
      });
    }

    const available = balance.allocated - balance.used - balance.pending;
    if (daysCount > available) {
      const error = new Error(
        `Insufficient leave balance. Requested: ${daysCount} days, Available: ${available} days`
      );
      (error as unknown as { statusCode: number }).statusCode = 422;
      throw error;
    }

    // Increment pending days
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { pending: { increment: daysCount } },
    });
  }

  // 4. Create the leave request
  const request = await prisma.leaveRequest.create({
    data: {
      employeeId: input.employeeId,
      leaveTypeId: input.leaveTypeId,
      startDate: start,
      endDate: end,
      daysCount,
      reason: input.reason,
      status: "PENDING",
    },
  });

  return request;
}

export async function reviewLeaveRequest(input: ReviewLeaveInput) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: input.leaveRequestId },
    include: {
      employee: {
        include: { user: true },
      },
      leaveType: true,
    },
  });

  if (!request) {
    const error = new Error("Leave request not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  if (request.status !== "PENDING") {
    const error = new Error(`Request has already been ${request.status.toLowerCase()}`);
    (error as unknown as { statusCode: number }).statusCode = 400;
    throw error;
  }

  const currentYear = new Date(request.startDate).getFullYear();
  const isPaid = request.leaveType.code !== "UNPAID";

  if (input.action === "APPROVE") {
    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          actionedById: input.reviewerId,
          actionedAt: new Date(),
          rejectionReason: input.comment || null,
        },
      });

      if (isPaid) {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year: currentYear,
          },
          data: {
            pending: { decrement: request.daysCount },
            used: { increment: request.daysCount },
          },
        });
      }

      // Create notification for employee
      await tx.notification.create({
        data: {
          userId: request.employee.userId,
          title: "Leave Request Approved",
          message: `Your leave request for ${request.daysCount} day(s) from ${new Date(request.startDate).toLocaleDateString()} has been approved.`,
          type: "LEAVE",
        },
      });
    });
  } else {
    // REJECT
    await prisma.$transaction(async (tx) => {
      await tx.leaveRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          actionedById: input.reviewerId,
          actionedAt: new Date(),
          rejectionReason: input.comment || "Rejected by HR",
        },
      });

      if (isPaid) {
        await tx.leaveBalance.updateMany({
          where: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year: currentYear,
          },
          data: {
            pending: { decrement: request.daysCount },
          },
        });
      }

      // Create notification for employee
      await tx.notification.create({
        data: {
          userId: request.employee.userId,
          title: "Leave Request Rejected",
          message: `Your leave request for ${request.daysCount} day(s) was rejected. Reason: ${input.comment || "No comment provided."}`,
          type: "LEAVE",
        },
      });
    });
  }

  return { success: true, status: input.action === "APPROVE" ? "APPROVED" : "REJECTED" };
}

export async function cancelLeaveRequest(requestId: string, employeeId: string) {
  const request = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
    include: { leaveType: true },
  });

  if (!request) {
    const error = new Error("Leave request not found");
    (error as unknown as { statusCode: number }).statusCode = 404;
    throw error;
  }

  if (request.employeeId !== employeeId) {
    const error = new Error("Unauthorized to cancel this request");
    (error as unknown as { statusCode: number }).statusCode = 403;
    throw error;
  }

  if (request.status !== "PENDING") {
    const error = new Error("Only pending leave requests can be cancelled");
    (error as unknown as { statusCode: number }).statusCode = 400;
    throw error;
  }

  const currentYear = new Date(request.startDate).getFullYear();
  const isPaid = request.leaveType.code !== "UNPAID";

  await prisma.$transaction(async (tx) => {
    await tx.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    if (isPaid) {
      await tx.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: currentYear,
        },
        data: {
          pending: { decrement: request.daysCount },
        },
      });
    }
  });

  return { success: true };
}
