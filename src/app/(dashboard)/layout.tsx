import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AIChatDrawer from "@/components/AIChatDrawer";
import DashboardShell from "@/components/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.mustChangePassword) {
    redirect("/change-password");
  }

  // Fetch employee name if EMPLOYEE role
  let displayName: string | undefined = undefined;
  if (session.role === "EMPLOYEE" && session.employeeId) {
    const emp = await prisma.employee.findUnique({
      where: { id: session.employeeId },
      select: { firstName: true, lastName: true },
    });
    if (emp) displayName = `${emp.firstName} ${emp.lastName}`;
  } else if (session.role === "ADMIN" || session.role === "HR") {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { employee: { select: { firstName: true, lastName: true } } },
    });
    if (user?.employee) {
      displayName = `${user.employee.firstName} ${user.employee.lastName}`;
    }
  }

  const user = {
    id: session.userId,
    email: session.email,
    role: session.role,
    name: displayName,
  };

  return (
    <DashboardShell user={user} role={session.role}>
      {children}
    </DashboardShell>
  );
}
