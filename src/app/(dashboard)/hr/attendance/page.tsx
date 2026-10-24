// HR Attendance Board — same as /hr dashboard.
// Redirect users landing here directly to the HR hub.
import { redirect } from "next/navigation";
export default function HRAttendancePage() {
  redirect("/hr");
}
