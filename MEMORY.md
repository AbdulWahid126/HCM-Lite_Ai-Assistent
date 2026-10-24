# HCM Lite — Project Memory & Architectural Decisions

### Environment & Context
- OS: Windows 11 (PowerShell terminal).
- Node.js: v24.22.0, npm: 11.19.1. Use `npm.cmd` and `npx.cmd` to bypass PowerShell script execution restrictions.
- Git repository initialized.
- Database: Prisma ORM configured to support PostgreSQL (Supabase/Neon) for production and SQLite (`dev.db`) for zero-dependency local runs and automated tests without requiring external PostgreSQL services during judging.

### Key Architectural Decisions
1. **Database Schema**: Normalized relational models covering Company, User, Employee, Department, Designation, OrgSettings, LeaveType, PublicHoliday, AttendanceRecord, AttendanceCorrection, LeaveRequest, SalaryStructure, PayrollRun, PayrollItem, Announcement, Notification, AuditLog, and AILog.
2. **Deterministic Calculations**:
   - Payroll gross = 1.5 * Basic salary (40% HRA, 10% Medical).
   - Per-day rate = Gross / Working days in current month.
   - Deductions = (absent_days * per_day) + (unpaid_leave_days * per_day) + (half_days * 0.5 * per_day).
   - Tax = Annualized gross salary passed into specified progressive PKR slabs, divided by 12.
3. **Attendance Rules**:
   - Single attendance record per employee per day.
   - Check-in > 09:15 is LATE.
   - Total hours < 5.0 is HALF_DAY.
   - Missing check-out flagged as `missing_checkout`.
4. **Security & RBAC**:
   - Role-based permissions (`ADMIN`, `HR`, `EMPLOYEE`).
   - Every API handler and AI tool derives user ID and role strictly from the server-verified JWT cookie.
   - Employees are locked to their own employee ID for all queries and mutations.
   - Formula injection protected in all CSV exports.
