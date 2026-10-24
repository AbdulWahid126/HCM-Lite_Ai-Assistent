# HCM Lite — Google Stitch Design Integration Plan
## High-Fidelity UI/UX Integration Architecture

This document establishes the comprehensive, screen-by-screen integration plan for mapping Google Stitch visual designs and HTML/Tailwind exports into the Next.js App Router application in `d:\Hackathon_Night_project`.

---

## 1. Design Reference Inventory & Screen Mapping

All design references are located in `d:\Hackathon_Night_project\STITCH_DESIGNS.md\design-references\`. Each screen directory contains both the rendered screenshot (`screen.png`) and the exported Tailwind HTML (`code.html`).

| # | Design Reference Directory | Visual Artifacts | Matching Application Screen Route | Intended Role | API Target(s) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `login_hcm_lite/` | `screen.png`, `code.html` | `/login` (`src/app/login/page.tsx`) | Public / Unauth | `POST /api/auth/login` |
| **2** | `first_run_setup_wizard/` | `screen.png`, `code.html` | `/setup` (`src/app/setup/page.tsx`) | First Run / Admin | `GET /api/auth/setup`<br>`POST /api/auth/setup` |
| **3** | `executive_admin_dashboard/` | `screen.png`, `code.html` | `/admin` (`src/app/(dashboard)/admin/page.tsx`) | `ADMIN` | `GET /api/analytics`<br>`POST /api/ai/summary` |
| **4** | `hr_operations_hub_attendance_board/` | `screen.png`, `code.html` | `/hr` & `/hr/attendance`<br>(`src/app/(dashboard)/hr/...`) | `HR`, `ADMIN` | `GET /api/attendance/board`<br>`GET /api/analytics` |
| **5** | `employee_self_service_dashboard/`<br>(variants `_1`, `_2`, `_3`) | `screen.png`, `code.html` | `/employee`<br>(`src/app/(dashboard)/employee/page.tsx`) | `EMPLOYEE` | `GET /api/analytics`<br>`POST /api/attendance/check-in`<br>`POST /api/attendance/check-out` |
| **6** | `employee_directory_bulk_csv_validator/` | `screen.png`, `code.html` | `/hr/employees`<br>(`src/app/(dashboard)/hr/employees/page.tsx`) | `HR`, `ADMIN` | `GET /api/employees`<br>`POST /api/employees`<br>`POST /api/employees/import`<br>`GET /api/employees/export` |
| **7** | `employee_360_profile_sara_ahmed_emp_002/`| `screen.png`, `code.html` | `/hr/employees/[id]` & `/employee/profile` | `HR`, `ADMIN`, `EMPLOYEE` | `GET /api/employees/[id]`<br>`PUT /api/employees/[id]` |
| **8** | `employee_leave_management_history/` | `screen.png`, `code.html` | `/employee/leaves`<br>(`src/app/(dashboard)/employee/leaves/page.tsx`) | `EMPLOYEE` | `GET /api/leave/balances`<br>`POST /api/leave/requests`<br>`DELETE /api/leave/requests/[id]` |
| **9** | `hr_leave_approval_inbox_coverage_board/` | `screen.png`, `code.html` | `/hr/leaves`<br>(`src/app/(dashboard)/hr/leaves/page.tsx`) | `HR`, `ADMIN` | `GET /api/leave/requests`<br>`PATCH /api/leave/requests/[id]` |
| **10**| `smart_natural_language_leave_extraction_modal/` | `screen.png`, `code.html` | Shared Component Modal<br>(`src/components/SmartLeaveModal.tsx`) | `EMPLOYEE` | `POST /api/ai/smart-leave`<br>`POST /api/leave/requests` |
| **11**| `monthly_payroll_processing/` | `screen.png`, `code.html` | `/hr/payroll`<br>(`src/app/(dashboard)/hr/payroll/page.tsx`) | `HR` (Draft),<br>`ADMIN` (Finalize) | `GET /api/payroll/runs`<br>`POST /api/payroll/runs`<br>`POST /api/payroll/runs/[id]` |
| **12**| `official_employee_payslip/` | `screen.png`, `code.html` | `/employee/payslips/[id]` & `/hr/payslips/[id]` | `EMPLOYEE`, `HR`, `ADMIN` | `GET /api/payroll/payslips/[id]` |
| **13**| `company_announcements_broadcasts/` | `screen.png`, `code.html` | `/announcements`<br>(`src/app/(dashboard)/announcements/page.tsx`) | All Roles | `GET /api/announcements`<br>`POST /api/announcements` |
| **14**| `in_app_notification_center_activity_feed/`| `screen.png`, `code.html` | Shared Component Drawer<br>(`src/components/NotificationDrawer.tsx`) | All Roles | `GET /api/notifications`<br>`PATCH /api/notifications` |
| **15**| `ai_hr_copilot_slide_over_drawer/` | `screen.png`, `code.html` | Shared Floating Drawer<br>(`src/components/AIChatDrawer.tsx`) | All Roles (Scoped) | `POST /api/ai/chat` |
| **16**| `hcm_lite/DESIGN.md` | Specification Markdown | Global Design System & Tailwind Theme Tokens | All | N/A |

---

## 2. Existing Frontend Structure & Reusable Components

### Framework & Styling Architecture
- **Framework:** Next.js 15.2.0 (App Router), React 19, TypeScript (strict mode).
- **Styling System:** Tailwind CSS 3.4.17 with custom extension tokens in `tailwind.config.js` and global tokens in `src/app/globals.css`.
- **Iconography:** Lucide React (`lucide-react`) and Google Material Symbols Outlined (supported via CDN link in layout).
- **Data Visualizations:** Recharts (`recharts`) for responsive BarChart and AreaChart visual analytics.
- **Form Management & Validation:** React Hook Form (`react-hook-form`) with `@hookform/resolvers/zod` and `zod`.

### Existing Components & Assets
* [src/components/Navbar.tsx](file:///d:/Hackathon_Night_project/src/components/Navbar.tsx) — Top navigation bar with role badges, notifications trigger, and AI copilot button.
* [src/components/Sidebar.tsx](file:///d:/Hackathon_Night_project/src/components/Sidebar.tsx) — Role-based navigation rail for `ADMIN`, `HR`, and `EMPLOYEE`.
* [src/components/AIChatDrawer.tsx](file:///d:/Hackathon_Night_project/src/components/AIChatDrawer.tsx) — Slide-over AI Copilot drawer with real server tool execution and Roman Urdu support.
* [src/components/SmartLeaveModal.tsx](file:///d:/Hackathon_Night_project/src/components/SmartLeaveModal.tsx) — Smart natural-language leave extraction dialog with manual confirmation safeguard.
* [src/app/globals.css](file:///d:/Hackathon_Night_project/src/app/globals.css) — Custom scrollbars, Tailwind base layer, and print stylesheet for PDF payslips.

---

## 3. Screen-by-Screen Implementation Plan

### 3.1 Login Screen (`/login`)
* **Reference:** `login_hcm_lite/code.html` & `screen.png`
* **Layout Structure:**
  - Left panel (55% width on desktop, hidden on small mobile): Deep emerald gradient (`#064e3b` to `#011f18`) with geometric grid pattern, glowing HCM Lite logo, headline "Intelligent Human Capital Management for Modern Workforces", and 3 glassmorphic bento cards highlighting punctuality, payroll tax sync, and AI operations.
  - Right panel (45% width): Centered sign-in card with email, password input (eye toggle), "Sign In" emerald CTA, and **1-click judging demo role switcher pills** (`Admin: admin@hcmlite.com`, `HR Manager: hr@hcmlite.com`, `Employee: emp@hcmlite.com`).
* **API Integration:**
  - `POST /api/auth/login` with `{ email, password }`.
  - Sets HTTP-only `hcm_session` cookie. If `mustChangePassword === true`, redirects to `/change-password`. Otherwise, redirects to `/admin`, `/hr`, or `/employee`.

### 3.2 First-Run Setup Wizard (`/setup`)
* **Reference:** `first_run_setup_wizard/code.html` & `screen.png`
* **Layout Structure:**
  - Centered multi-step onboarding card with a 3-step progress bar:
    1. **Company Profile**: Legal Name, Official Email, Phone, Country (Pakistan/PKR).
    2. **Office Rules & Geofence**: Office Start Time (default 09:00), Grace Period (15 mins), Half-Day Threshold (5.0h), Weekend Days (Sat/Sun), Geofence (24.8607° N, 67.0011° E, 150m radius).
    3. **Administrator Credentials**: Master Admin email and password.
  - Final step triggers transactional initialization with celebration screen and "Proceed to Login" CTA.
* **API Integration:**
  - `GET /api/auth/setup` checks if setup is needed.
  - `POST /api/auth/setup` creates Company, OrgSettings, default LeaveTypes (Annual 14, Sick 8, Casual 10, Unpaid 0), standard Departments (ENG, HR, FIN), Designations, and Admin user.

### 3.3 Main Admin Dashboard (`/admin`)
* **Reference:** `executive_admin_dashboard/code.html` & `screen.png`
* **Layout Structure:**
  - Top KPI banner: Total Headcount, YTD Attrition %, Monthly Payroll Cost, and Average Salary.
  - AI Executive Briefing Banner with "Generate AI Summary" button and verified disclaimer badge.
  - 2-column analytics grid:
    - Left: Department headcount & payroll bar chart (Recharts).
    - Right: Gender and diversity distribution donut chart.
  - Bottom section: Live immutable audit activity table (latest 8 system events with timestamps) and administrative quick-links (Org Settings, User Management).
* **API Integration:**
  - `GET /api/analytics` (where session role is `ADMIN`).
  - `POST /api/ai/summary` to refresh executive summary bullets.

### 3.4 HR Operations Hub & Attendance Board (`/hr` and `/hr/attendance`)
* **Reference:** `hr_operations_hub_attendance_board/code.html` & `screen.png`
* **Layout Structure:**
  - Filter bar: Department select ("All Departments", "Engineering", etc.) and Date picker (defaulting to today).
  - 5 Operational KPI cards: Total Headcount, Present Today (green), Late Arrivals (>09:15, amber), On Leave (blue), Pending Approvals (rose).
  - 7-Day Attendance Trend area chart and Top 5 Late-Comers ranking card.
  - Daily Attendance Board Table: Employee Code, Name & Avatar, Department, Check-In, Check-Out, Worked Hours, Geofence Verification Status badge, and "Review Correction" button.
* **API Integration:**
  - `GET /api/attendance/board?date=YYYY-MM-DD&departmentId=...`
  - `GET /api/analytics` (HR role).
  - `PATCH /api/attendance/corrections` for inline correction reviews.

### 3.5 Employee Self-Service Dashboard (`/employee`)
* **Reference:** `employee_self_service_dashboard/code.html` & `screen.png` (variants `_1`, `_2`, `_3`)
* **Layout Structure:**
  - Hero Check-In/Check-Out Card: Live digital clock, office hours reminder (09:00 AM, 15m grace), GPS location range badge ("Within 150m"), large emerald "Check In Now" button (or "Check Out" with worked hours timer if checked in).
  - Weekly Hours progress card (32.5h / 40.0h standard).
  - Leave Balance Quota progress rings: Annual (11/14), Sick (7/8), Casual (9/10).
  - Latest Payslip card with month, net pay, and PDF view link.
  - Announcements stream.
* **API Integration:**
  - `GET /api/analytics` (EMPLOYEE role).
  - `POST /api/attendance/check-in` (with optional latitude/longitude).
  - `POST /api/attendance/check-out`.

### 3.6 Employee Directory & Bulk CSV Validator (`/hr/employees`)
* **Reference:** `employee_directory_bulk_csv_validator/code.html` & `screen.png`
* **Layout Structure:**
  - Search toolbar, department filter pills, and action buttons ("Export CSV", "Import CSV", "+ Add Employee").
  - Tabular directory with employee code, name, designation, department, status pill, joining date, and gross salary.
  - CSV Import Modal with dry-run toggle: displays parsed row count, valid rows, invalid rows, and detailed issue report (Row #, Field, Reason) before committing.
* **API Integration:**
  - `GET /api/employees?search=...&departmentId=...&page=...`
  - `POST /api/employees/import` (supports `dryRun=true` for validation report).
  - `GET /api/employees/export` (downloads formula-injection-sanitized CSV).

### 3.7 Employee 360 Profile (`/hr/employees/[id]`)
* **Reference:** `employee_360_profile_sara_ahmed_emp_002/code.html` & `screen.png`
* **Layout Structure:**
  - Profile header: Large avatar, full name, code ("EMP-002"), role tag, status badge, department, and contact info.
  - 4 Tabbed panels:
    1. **Personal & Job Details**: Email, phone, address, gender, joining date.
    2. **Salary Structure**: Basic, HRA (40%), Medical (10%), Gross (1.5x), and annualized tax slab estimate.
    3. **Attendance History**: Monthly calendar heat-map and recent check-in/out log table.
    4. **Leave Balances & History**: Quotas and table of past requests with statuses.
* **API Integration:**
  - `GET /api/employees/[id]`.
  - `PUT /api/employees/[id]` (employees can update phone/address; HR/Admin can update all fields).

### 3.8 Employee Leave Management & History (`/employee/leaves`)
* **Reference:** `employee_leave_management_history/code.html` & `screen.png`
* **Layout Structure:**
  - Quota balance cards showing Allocated, Used, Pending, and Available days.
  - Action buttons: "Apply for Leave" and "Smart AI Leave Filing".
  - Leave Application Modal with live working-day calculation excluding weekends and public holidays.
  - Leave History table with "Cancel" button for pending requests.
* **API Integration:**
  - `GET /api/leave/balances`.
  - `POST /api/leave/requests`.
  - `DELETE /api/leave/requests/[id]` (cancels pending requests).

### 3.9 HR Leave Approval Inbox & Coverage Board (`/hr/leaves`)
* **Reference:** `hr_leave_approval_inbox_coverage_board/code.html` & `screen.png`
* **Layout Structure:**
  - Pending approval cards showing applicant name, department, requested dates, computed working days, reason, and current remaining balance.
  - Quick action buttons on each card: "Approve" (green) and "Reject" (red).
  - Modal dialog for HR to enter comments before confirming.
* **API Integration:**
  - `GET /api/leave/requests?status=PENDING`.
  - `PATCH /api/leave/requests/[id]` with `{ action: "APPROVE" | "REJECT", comment }`.

### 3.10 Smart Natural-Language Leave Modal
* **Reference:** `smart_natural_language_leave_extraction_modal/code.html` & `screen.png`
* **Layout Structure:**
  - Natural language input textarea (e.g. "I need next Monday and Tuesday off for my sister's wedding").
  - "Extract Details" AI button.
  - Structured Review Card displaying extracted leave type, start date, end date, and reason with explicit notice: *"AI never submits requests automatically. Please review and confirm."*
  - "Confirm & Apply" primary action button.
* **API Integration:**
  - `POST /api/ai/smart-leave` (calls LLM or grounded rule-based date extractor).
  - `POST /api/leave/requests` upon user confirmation.

### 3.11 Monthly Payroll Processing (`/hr/payroll`)
* **Reference:** `monthly_payroll_processing/code.html` & `screen.png`
* **Layout Structure:**
  - Payroll run selector (Month/Year) with "Generate Draft" action.
  - Status banner: Blue for "DRAFT", Emerald with lock icon for "FINALIZED & LOCKED".
  - Summary KPI cards: Total Gross, Total Deductions, Total Tax Withheld, Net Disbursement.
  - Transparent employee payroll table showing Basic, HRA, Medical, Gross, Working Days, Absent/Half-Day/Unpaid deductions, Tax, and Net Pay.
  - Finalization banner: Admin-only "Finalize & Lock Payroll" button.
* **API Integration:**
  - `GET /api/payroll/runs`.
  - `POST /api/payroll/runs` (generates draft).
  - `POST /api/payroll/runs/[id]` (Admin finalization & lock).

### 3.12 Official Employee Payslip (`/employee/payslips/[id]`)
* **Reference:** `official_employee_payslip/code.html` & `screen.png`
* **Layout Structure:**
  - Professional A4 document canvas: Company header, Tax ID, title "SALARY PAYSLIP — [MONTH YEAR]".
  - 2-column Employee Details box (Name, ID, Department, Bank account, Days Worked).
  - Side-by-side Earnings & Deductions ledger.
  - Highlighted Net Salary box (e.g. "PKR 125,450" with amount in words).
  - "Print Payslip" button invoking `window.print()` with clean `@media print` rules.
* **API Integration:**
  - `GET /api/payroll/payslips/[id]` (strictly scoped to the owner employee or HR/Admin).

### 3.13 Company Announcements & Broadcasts (`/announcements`)
* **Reference:** `company_announcements_broadcasts/code.html` & `screen.png`
* **Layout Structure:**
  - Feed of broadcast cards with priority pill badges (Low, Normal, High, Urgent), publication date, and author badge.
  - "+ Post Announcement" modal for Admin & HR with priority and target audience selectors.
* **API Integration:**
  - `GET /api/announcements` and `POST /api/announcements`.

### 3.14 In-App Notification Center & Activity Feed
* **Reference:** `in_app_notification_center_activity_feed/code.html` & `screen.png`
* **Layout Structure:**
  - Popover dropdown in top navigation bar with unread count badge.
  - Categorized items with distinct icons (Leave Decisions, Payroll Available, Attendance Corrections, Announcements).
  - "Mark all as read" action.
* **API Integration:**
  - `GET /api/notifications` and `PATCH /api/notifications`.

### 3.15 AI HR Copilot Slide-Over Drawer
* **Reference:** `ai_hr_copilot_slide_over_drawer/code.html` & `screen.png`
* **Layout Structure:**
  - 384px slide-over drawer accessible globally.
  - Role-specific suggestion chips.
  - Conversation stream with user bubbles (emerald) and assistant bubbles (slate-100).
  - Server tool execution badge: "⚡ Executed server tool: [tool_name] • Verified database record".
  - Roman Urdu support and peer-salary access refusal security message.
* **API Integration:**
  - `POST /api/ai/chat` (rate limited to ~25 req/hr, 15s timeout, logged in `ai_logs`).

---

## 4. Components Architecture: Reusable vs. New

```
src/
├── components/
│   ├── Navbar.tsx             [EXISTS - Extend with Stitch avatar & notification drawer]
│   ├── Sidebar.tsx            [EXISTS - Match Stitch 240px nav rail & active pill styles]
│   ├── AIChatDrawer.tsx       [EXISTS - Match Stitch slide-over styling & prompt chips]
│   ├── SmartLeaveModal.tsx    [EXISTS - Match Stitch extraction card layout]
│   ├── AttendanceWidget.tsx   [TO CREATE - Hero check-in/out widget with digital clock]
│   ├── NotificationDrawer.tsx [TO CREATE - Flyout activity feed from Navbar]
│   ├── KPICard.tsx            [TO CREATE - Reusable metric widget with trend pill]
│   ├── DataTable.tsx          [TO CREATE - Standardized table wrapper with pagination]
│   └── StatusBadge.tsx        [TO CREATE - Standardized pill for Present, Late, etc.]
```

---

## 5. Responsive Behavior & UI States

### Viewport Breakpoints
- **Mobile (< 768px):** Sidebar collapses to an off-canvas drawer with top hamburger toggle; tables scroll horizontally with sticky action columns; KPI grids collapse to 1 or 2 columns; sticky bottom action bars for mobile check-in.
- **Tablet (768px – 1024px):** 2-column KPI grids, responsive search toolbars, collapsible left navigation rail.
- **Desktop (1024px+):** Full 12-column layout with fixed 240px sidebar, expanded 4/5-column KPI grids, and side-by-side charts.

### Operational UI States
- **Loading:** Skeleton shimmer cards matching exact card dimensions; micro-spinners inside action buttons (`isSubmitting`).
- **Empty States:** Friendly, actionable zero-states (e.g. "No pending leaves — you're all caught up!", "No employees found — adjust search filters or add a new team member").
- **Error Feedback:** Inline field validation messages in rose-600; top banner toast notifications for network errors or rate limit warnings.
- **Success Feedback:** Floating toast notifications (e.g. "Check-in recorded at 09:02 AM", "Payroll draft generated successfully").

---

## 6. Implementation Sequence & Verification Order

```
Step 1: Setup & Login Authentication Flow
  ├── Wire /login with Stitch split-screen & demo role switcher
  ├── Wire /setup with 3-step organization wizard
  └── Verify initial login & session redirection (Admin/HR/Employee)

Step 2: App Shell & Shared Layout
  ├── Update globals.css with Google Stitch typography & exact theme tokens
  ├── Align Navbar & Sidebar with Stitch aesthetics
  └── Verify role-based navigation switching

Step 3: Core Role Dashboards
  ├── Build /admin executive dashboard (KPIs, Recharts, AI summary, audit stream)
  ├── Build /hr dashboard & daily attendance board with filters
  └── Build /employee self-service dashboard (Hero clock-in/out, hours progress, leave rings)

Step 4: Employee Directory & 360 Profiles
  ├── Build /hr/employees directory with search, pagination, and CSV import modal
  └── Build /hr/employees/[id] 4-tab 360 profile

Step 5: Leave Management & Approval
  ├── Build /employee/leaves with quota cards & Smart AI leave extraction modal
  └── Build /hr/leaves approval inbox with Approve/Reject modal

Step 6: Payroll Processing & Official Payslip
  ├── Build /hr/payroll processing draft review & Admin finalization lock
  └── Build /employee/payslips/[id] printable A4 payslip view

Step 7: Announcements, Notifications, & AI Copilot
  ├── Build /announcements feed & creation modal
  ├── Wire NotificationDrawer into Navbar
  └── Verify AIChatDrawer tool execution across all 3 roles

Step 8: End-to-End Verification
  ├── Run Vitest suite (`npm test`)
  ├── Verify 5-minute hackathon judging flow
  └── Run production build (`npm run build`)
```

---

## 7. Design Completeness Audit

* **Missing Screens:** **None**. All 10 screens specified in the challenge brief and `STITCH_PROMPTS.md` have corresponding visual screenshots and HTML code in `design-references/`.
* **Blockers:** **None**. All backend APIs, database models, calculations, and unit tests are already implemented and operational.
* **Ready State:** The implementation plan is 100% complete and ready for execution upon user approval.
