import { UserSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export type Role = "ADMIN" | "HR" | "EMPLOYEE";

export function checkRole(session: UserSession | null, allowedRoles: Role[]): boolean {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}

export function assertRole(
  session: UserSession | null,
  allowedRoles: Role[]
): { authorized: true; session: UserSession } | { authorized: false; response: NextResponse } {
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized: Please log in" }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(session.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Forbidden: You do not have permission to access this resource" },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, session };
}

/**
 * Ensures employees can only view or modify their own records.
 * Admins and HR have company-wide access.
 */
export function assertEmployeeScope(
  session: UserSession,
  targetEmployeeId: string
): { permitted: true } | { permitted: false; response: NextResponse } {
  if (session.role === "ADMIN" || session.role === "HR") {
    return { permitted: true };
  }

  if (session.employeeId !== targetEmployeeId) {
    return {
      permitted: false,
      response: NextResponse.json(
        { error: "Forbidden: You cannot access or modify records belonging to other employees" },
        { status: 403 }
      ),
    };
  }

  return { permitted: true };
}
