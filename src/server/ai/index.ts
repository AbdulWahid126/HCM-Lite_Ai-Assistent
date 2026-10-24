import { prisma } from "@/lib/prisma";
import { UserSession } from "@/lib/auth";
import { getAdminAnalytics, getHrAnalytics, getEmployeeAnalytics } from "@/server/analytics";

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}

// In-memory rate limiter: Map<userId, { count: number, resetAt: number }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkAiRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limitWindowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 25; // ~20-25 req/hr

  const record = rateLimitMap.get(userId);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + limitWindowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Tool definitions schema for OpenAI-compatible LLMs
export const AI_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_headcount",
      description: "Get active company headcount and department breakdown (Admin and HR only).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_attendance_summary",
      description: "Get today's attendance summary (present, late, on-leave) for HR/Admin, or personal attendance for Employee.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "Optional date in YYYY-MM-DD format" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_late_comers",
      description: "Get top late-comers for the current month (Admin and HR only).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_leave_summary",
      description: "Get overview of leaves taken and pending approvals (Admin and HR only).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_leave_balance",
      description: "Get the current authenticated employee's remaining leave balances.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payroll_summary",
      description: "Get monthly payroll expenditure and average salary (Admin only).",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_employees",
      description: "Search active employees by name, department, or code (HR and Admin only).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (name, code, or department)" },
        },
        required: ["query"],
      },
    },
  },
];

/**
 * Executes a tool securely with server-side role and record-scope enforcement
 */
export async function executeAiTool(
  toolName: string,
  args: Record<string, unknown>,
  session: UserSession
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case "get_headcount": {
      if (session.role !== "ADMIN" && session.role !== "HR") {
        return { error: "Access denied: Only Admin and HR can view overall headcount." };
      }
      const data = await getAdminAnalytics(session.companyId);
      return {
        totalHeadcount: data.totalHeadcount,
        departmentBreakdown: data.departmentAnalytics,
        attritionRate: data.attritionRate,
      };
    }

    case "get_attendance_summary": {
      if (session.role === "EMPLOYEE") {
        if (!session.employeeId) return { error: "No employee profile found." };
        const data = await getEmployeeAnalytics(session.employeeId);
        return {
          status: data.todayAttendance?.status || "NOT_CHECKED_IN",
          checkInTime: data.todayAttendance?.checkIn || null,
          checkOutTime: data.todayAttendance?.checkOut || null,
          workedHours: data.todayAttendance?.workedHours || 0,
          weeklyHours: data.weeklyHours,
        };
      }
      const data = await getHrAnalytics(session.companyId);
      return {
        totalHeadcount: data.totalHeadcount,
        presentToday: data.presentToday,
        onLeaveToday: data.onLeaveToday,
        lateArrivalsToday: data.lateArrivalsToday,
      };
    }

    case "get_late_comers": {
      if (session.role !== "ADMIN" && session.role !== "HR") {
        return { error: "Access denied: Only Admin and HR can view late-comers." };
      }
      const data = await getHrAnalytics(session.companyId);
      return { topLateComers: data.topLateComers };
    }

    case "get_leave_summary": {
      if (session.role !== "ADMIN" && session.role !== "HR") {
        return { error: "Access denied: Only Admin and HR can view company leave summaries." };
      }
      const data = await getHrAnalytics(session.companyId);
      return {
        pendingApprovals: data.totalPendingApprovals,
        leaveUtilization: data.leaveUtilization,
        onLeaveToday: data.onLeaveToday,
      };
    }

    case "get_my_leave_balance": {
      if (!session.employeeId) {
        return { error: "No associated employee record found." };
      }
      const data = await getEmployeeAnalytics(session.employeeId);
      return { leaveBalances: data.leaveSummary };
    }

    case "get_payroll_summary": {
      if (session.role !== "ADMIN") {
        return { error: "Access denied: Only Admin can view payroll summary and costs." };
      }
      const data = await getAdminAnalytics(session.companyId);
      return {
        totalPayrollCost: data.totalPayrollCost,
        averageSalary: data.averageSalary,
      };
    }

    case "search_employees": {
      if (session.role !== "ADMIN" && session.role !== "HR") {
        return { error: "Access denied: Only Admin and HR can search employee directory via AI." };
      }
      const query = String(args.query || "");
      const employees = await prisma.employee.findMany({
        where: {
          companyId: session.companyId,
          OR: [
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { employeeCode: { contains: query } },
          ],
        },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          email: true,
          employmentStatus: true,
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
        take: 10,
      });
      return { employees };
    }

    default:
      return { error: `Tool ${toolName} not supported.` };
  }
}
