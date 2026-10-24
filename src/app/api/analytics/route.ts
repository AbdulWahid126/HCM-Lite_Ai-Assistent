import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAdminAnalytics, getHrAnalytics, getEmployeeAnalytics } from "@/server/analytics";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("departmentId") || undefined;

  if (session.role === "ADMIN") {
    const data = await getAdminAnalytics(session.companyId);
    return NextResponse.json({ role: "ADMIN", data });
  }

  if (session.role === "HR") {
    const data = await getHrAnalytics(session.companyId, departmentId);
    return NextResponse.json({ role: "HR", data });
  }

  // EMPLOYEE
  if (!session.employeeId) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 400 });
  }
  const data = await getEmployeeAnalytics(session.employeeId);
  return NextResponse.json({ role: "EMPLOYEE", data });
}
