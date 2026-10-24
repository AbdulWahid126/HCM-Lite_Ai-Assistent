import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { assertRole } from "@/server/permissions";
import { prisma } from "@/lib/prisma";
import { buildSafeCsvRow } from "@/lib/export-sanitizer";

export async function GET() {
  const session = await getSession();
  const auth = assertRole(session, ["ADMIN", "HR"]);
  if (!auth.authorized) return auth.response;

  const employees = await prisma.employee.findMany({
    where: { companyId: auth.session.companyId },
    include: {
      department: true,
      designation: true,
      salaryStructure: true,
    },
    orderBy: { employeeCode: "asc" },
  });

  const header = [
    "Employee Code",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Address",
    "Department",
    "Designation",
    "Status",
    "Joining Date",
    "Basic Salary",
    "Gross Salary",
  ];

  const lines = [buildSafeCsvRow(header)];

  for (const emp of employees) {
    const row = [
      emp.employeeCode,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.phone || "",
      emp.address || "",
      emp.department?.name || "",
      emp.designation?.title || "",
      emp.employmentStatus,
      new Date(emp.joiningDate).toISOString().split("T")[0],
      emp.salaryStructure?.basicSalary || 0,
      emp.salaryStructure?.grossSalary || 0,
    ];
    lines.push(buildSafeCsvRow(row));
  }

  const csvContent = lines.join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="employees-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
