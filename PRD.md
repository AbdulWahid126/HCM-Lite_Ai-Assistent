# HCM Lite — AI-Assisted Human Capital Management
## Product Requirements Document (PRD)

### 1. Executive Summary
**HCM Lite** is a full-stack, secure, responsive, and deployment-ready Human Capital Management (HCM) web application built for the Saylani Hackathon (October 24, 2026). It empowers organizations with automated HR workflows, real-time attendance tracking, policy-governed leave management, compliant payroll calculations, interactive analytics, and an enterprise AI assistant equipped with server-side tool calling and strict role-based data boundaries.

### 2. User Roles & Personas
- **ADMIN**:
  - Performs first-run company bootstrap and configuration.
  - Manages company settings (office hours, grace period, geofence, weekends, holidays, leave quotas).
  - Creates and manages HR accounts.
  - Reviews and locks/finalizes monthly payroll runs.
  - Views immutable audit logs and company-wide analytics.
  - Posts company announcements.
  - Uses AI assistant on authorized company-wide data.
- **HR**:
  - Registers employees and sets up initial employee credentials with temporary passwords.
  - Manages employee profiles, departments, designations, and salary structures.
  - Performs dry-run CSV imports and bulk CSV exports.
  - Monitors daily attendance board, late arrivals, and reviews attendance corrections.
  - Evaluates and approves/rejects leave requests with mandatory comments.
  - Prepares monthly draft payroll runs and reviews deductions.
  - Posts announcements and accesses HR analytics.
- **EMPLOYEE**:
  - Changes temporary password on first login (mandatory).
  - Web check-in / check-out with server-generated timestamps and geofence/biometric verification options.
  - Views personal attendance calendar and submits attendance correction requests.
  - Checks leave balance and applies for leave (via UI or smart natural language AI form).
  - Views and downloads personal monthly payslips.
  - Views announcements and in-app notifications.
  - Interacts with AI assistant strictly scoped to personal records and general company policies.

### 3. Core Modules & Functional Requirements

#### Module 1: Authentication & Access Control (M1)
- First-run company setup and Admin bootstrap (`ADMIN_EMAIL`, `ADMIN_PASSWORD` or guided wizard).
- Secure JWT-based authentication in HTTP-only, secure, SameSite cookies.
- Server-side role authorization (`ADMIN`, `HR`, `EMPLOYEE`) and record-level data scoping.
- Mandatory password change on first employee login (`mustChangePassword: true`).
- Admin account activation/deactivation and password resets.
- Clear HTTP 401 (Unauthorized) and HTTP 403 (Forbidden) handling.

#### Module 2: Organization Setup (M2)
- Company profile, office start time (default `09:00`), grace period (default `15 min`), weekends (default `Saturday, Sunday`).
- Office latitude/longitude & geofence radius (default `150 meters`).
- Department and Designation CRUD.
- Leave types with annual quotas: Annual (14), Sick (8), Casual (10), Unpaid (unlimited subject to approval).
- Public holidays calendar.
- Read-only visibility for HR; modification restricted to Admin.

#### Module 3: Employee Management (M3)
- Employee registration by HR with auto/manual employee code, email, phone, address, department, designation, joining date, status, salary structure.
- Employee 360 profile.
- Self-service profile editing restricted to phone and address.
- Employee directory with server-side pagination, search, and department/status filtering.
- CSV import with pre-flight dry-run validation (row, field, reason) and safe batch commit.
- CSV export protected against formula injection (`=`, `+`, `-`, `@` sanitization).

#### Module 4: Attendance Management (M4)
- Web check-in & check-out with server-generated UTC timestamps.
- Single attendance record per employee per day; duplicate check-in returns HTTP 409 Conflict.
- Arrival after `09:15` marked as `LATE`.
- Worked hours < 5 hours marked as `HALF_DAY`.
- Expected working day with no record and no approved leave marked as `ABSENT`.
- Unclosed check-in flagged as `missing_checkout`.
- Attendance correction requests with employee reason; HR approval/rejection updates audit and status.

#### Module 5: Leave Management (M5)
- Leave request submission with start date, end date, leave type, and reason.
- Working-day calculation excluding configured weekends and public holidays.
- Server validation: overlap prevention, quota balance verification (HTTP 422 on violation).
- HR approval/rejection with mandatory comments; instant notification to employee.
- Approved leave immediately updates employee leave balance.

#### Module 6: Payroll Lite (M6)
- Salary structure: Basic Salary, HRA (40% of basic), Medical (10% of basic), Gross = 1.5 × Basic.
- Per-day rate = Gross Monthly Salary ÷ Applicable Working Days in month.
- Deductions: Absent days (full day), Unpaid leave (full day), Half-days (0.5 day).
- Proration for mid-month joining or leaving dates.
- Progressive annualized illustrative tax slabs:
  - <= 600,000 PKR: 0%
  - > 600k to 1.2M PKR: 5% of excess
  - > 1.2M to 2.4M PKR: 30,000 + 15% of excess
  - > 2.4M to 3.6M PKR: 210,000 + 25% of excess
  - > 3.6M PKR: 510,000 + 35% of excess
- Monthly tax deduction = Annual Tax ÷ 12.
- HR prepares and reviews draft payroll; only Admin can finalize and lock payroll.
- Persistent payroll items and downloadable/printable PDF payslips with strict employee scoping.

#### Module 7: Dashboards & Analytics (M7)
- Admin: Headcount, YTD attrition, monthly payroll cost, average salary, department breakdowns, audit stream, AI summary.
- HR: Today's attendance (present, on-leave, late arrivals), pending approvals, attendance trends, top late-comers, department absenteeism, AI summary.
- Employee: Check-in/out widget, weekly hours vs 40h standard, late count, leave balances, recent payslip, announcements.
- All metrics computed dynamically from database; zero fake or hardcoded values; empty database displays graceful zero-states.

#### Module 8: AI Assistant (M8)
- Persistent / overlay chat assistant with server-executed tool calling:
  - `get_headcount`
  - `get_attendance_summary`
  - `get_late_comers`
  - `get_leave_summary`
  - `get_my_leave_balance`
  - `get_payroll_summary`
  - `search_employees`
- Strict role-based scoping (employees cannot view peers' salaries or private data).
- Natural language "Smart Leave Form" extraction returning prefilled review modal.
- Policy Q&A grounded strictly in company settings.
- Rate limiting (~20 req/user/hr), 15s timeout, graceful provider fallbacks, and audit logging in `ai_logs`.

#### Module 9: Communications & Audit (M9)
- Announcements posted by Admin/HR.
- In-app notification center (leave decisions, payslips, announcements) with read/unread tracking.
- Immutable audit log tracking actor, action, entity type, ID, timestamp, before/after state diff.
