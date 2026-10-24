import { redirect } from "next/navigation";

export default async function HRPayslipRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/employee/payslips/${id}`);
}
