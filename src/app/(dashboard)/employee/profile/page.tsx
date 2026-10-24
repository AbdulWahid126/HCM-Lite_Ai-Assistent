import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function EmployeeProfileRedirect() {
  const session = await getSession();
  if (!session || !session.employeeId) {
    redirect("/employee");
  }
  redirect(`/hr/employees/${session.employeeId}`);
}
