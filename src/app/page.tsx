import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await getSession();

  if (session) {
    if (session.mustChangePassword) {
      redirect("/change-password");
    }
    if (session.role === "ADMIN") redirect("/admin");
    if (session.role === "HR") redirect("/hr");
    redirect("/employee");
  }

  // Check if setup is needed
  const companyCount = await prisma.company.count();
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  if (companyCount === 0 || adminCount === 0) {
    redirect("/setup");
  }

  redirect("/login");
}
