# HCM Lite — Google Stitch UI/UX Design Prompts
## AI-Assisted Human Capital Management System — Saylani Hackathon

This document provides copy-paste-ready, high-fidelity prompts for **Google Stitch** to generate the complete visual design system and screen layouts for **HCM Lite**.

All prompts strictly follow the design system defined in [DESIGN.md](file:///d:/Hackathon_Night_project/DESIGN.md), the product requirements in [PRD.md](file:///d:/Hackathon_Night_project/PRD.md), the system architecture in [ARCHITECTURE.md](file:///d:/Hackathon_Night_project/ARCHITECTURE.md), and the established backend REST API contracts.

---

## 0. Shared Application Shell & Design Tokens

### Role
Shared by all authenticated roles (`ADMIN`, `HR`, `EMPLOYEE`).

### Copy-Paste Google Stitch Prompt
```text
Design a responsive, enterprise-grade application shell for a modern B2B HR SaaS platform named "HCM Lite — AI-Assisted Human Capital Management".

Visual Style:
- Clean, refined, high-density modern SaaS aesthetic (comparable to Linear, Rippling, or Gusto).
- Neutral background: Canvas #f8fafc (slate-50), Surface #ffffff, subtle 1px border #e2e8f0 (slate-200), subtle soft shadow (0 1px 3px rgba(0,0,0,0.05)).
- Brand jewel accent: Deep vibrant Emerald Green #059669 (primary) with energetic Teal #14b8a6 accents. Hover state: #047857.
- Typography: Inter or Outfit font stack with clear optical hierarchy (12px labels, 14px body, 16px section headers, 24px-30px metric titles). Semi-bold (600) and Bold (700) weights for key data.
- Crisp status badges:
  • Present/Approved/Finalized: Soft emerald pill (bg #ecfdf5, text #047857, border #a7f3d0).
  • Late/Pending: Soft amber pill (bg #fffbeb, text #b45309, border #fde68a).
  • Absent/Rejected: Soft rose pill (bg #fff1f2, text #be123c, border #fecdd3).
  • Draft/Info: Soft blue pill (bg #eff6ff, text #1d4ed8, border #bfdbfe).

Layout Structure:
1. Top Navigation Bar (Fixed 64px height):
   - Left: HCM Lite brand mark (emerald briefcase logo icon) + bold app title + subtitle "AI-ASSISTED HR" in uppercase 10px tracking.
   - Right: "Ask AI" glowing pill button with pulsing sparkles icon, interactive Notification bell with unread badge count (e.g. "3"), vertical divider, user avatar badge displaying initials, user full name, and role tag ("ADMIN" in purple, "HR" in blue, or "EMPLOYEE" in emerald), and logout action icon.
2. Collapsible Left Sidebar (Fixed 256px desktop, off-canvas drawer on mobile):
   - Section header indicating the active role context (e.g. "ADMIN NAVIGATION").
   - Navigation links with consistent 16px Lucide icons, rounded 12px pill active state (filled emerald background with white text and glow shadow).
   - Bottom pinned feature card: "AI Copilot Active — Role-scoped intelligence & natural-language workflows ready".
3. Main Content Container:
   - Dynamic fluid canvas with max-w-7xl auto-centering, responsive padding (p-4 mobile, p-6 tablet, p-8 desktop).
   - Sticky breadcrumb & page header banner with primary actions on the right (e.g. "Export CSV", "Add Employee", "Check In").
4. Persistent Floating Elements:
   - Floating AI chat drawer trigger button in bottom right (#059669 with sparkles icon) that expands an off-canvas 380px chat assistant panel.
```

### Components & Layout
- `AppShell`: Topbar, Sidebar, Main Canvas, Floating AI Trigger.
- `RoleBadge`: Color-coded badge (`ADMIN` = purple, `HR` = blue, `EMPLOYEE` = emerald).
- `NotificationPopover`: Dropdown list showing recent system notifications with unread indicators and "Mark all read".

### API Connection Notes
- Active user session supplied by `GET /api/auth/me`.
- Notifications list and unread count populated via `GET /api/notifications` and `PATCH /api/notifications`.

---

## 1. Main Admin Dashboard

### Role
`ADMIN`

### Copy-Paste Google Stitch Prompt
```text
Design the executive Admin Dashboard for "HCM Lite", a high-performance HR SaaS platform. The dashboard provides company-wide executive visibility into headcount, payroll costs, attrition, organizational departments, and real-time audit activity.

Visual & Layout Requirements:
1. Executive Header:
   - Page Title: "Executive Overview" with live date subtitle.
   - Top-right action: "Generate AI Summary" button with a magic sparkles icon in emerald gradient, and an "Organization Settings" shortcut button.
2. AI Intelligence Summary Banner:
   - Elevated glassmorphic card with subtle emerald gradient border.
   - Displays 3-4 bulleted bullet points summarizing workforce trends, payroll burn, and punctuality with an "AI-generated • Verified server data" disclaimer badge.
3. Top KPI Metric Cards (4-column responsive grid):
   - Card 1: "Total Active Headcount" (large 32px bold number, e.g. "48", trend badge "+4 this month", icon: Users).
   - Card 2: "YTD Attrition Rate" (e.g. "2.1%", subtitle "1 exit this year", badge: "Low Risk", icon: UserMinus).
   - Card 3: "Monthly Payroll Expenditure" (e.g. "PKR 4,850,000", subtitle "Draft/Finalized run", icon: Banknote).
   - Card 4: "Average Monthly Salary" (e.g. "PKR 101,041", subtitle "Across all departments", icon: TrendingUp).
4. Analytics Visualizations Section (2-column grid):
   - Left Card: "Headcount & Cost by Department" — Clean stacked or grouped bar chart displaying Engineering, HR, Finance, Operations headcount with hover tooltips showing total department gross payroll.
   - Right Card: "Gender & Diversity Distribution" — Elegant donut chart (Male, Female, Other) with central metric and legend.
5. Live Audit Trail & Quick Administrative Controls:
   - Left: "Recent Audit Activity" table/list showing latest 6 immutable system actions (Actor email, Role badge, Action e.g. "PAYROLL_FINALIZED", Entity, and relative timestamp e.g. "12m ago").
   - Right: Quick Action Cards (Company Office Hours, Geofence Radius Setup, HR Account Management).
6. Empty State:
   - When no employees exist yet, render a clean, welcoming onboarding banner: "Organization initialized. Next step: Configure departments and register HR accounts to start populating records."
```

### Components & Layout
- Top KPI Grid (4 cards with Lucide icons and trend badges).
- AI Executive Summary Card with refresh trigger.
- Recharts Bar Chart (Headcount & Payroll by Dept) and Donut Chart (Gender/Diversity).
- Recent Audit Log feed with timestamp pills.

### API Connection Notes
- All KPI numbers, charts, and audit feeds load dynamically from `GET /api/analytics` (where role is `ADMIN`).
- Executive summary generated from `POST /api/ai/summary`.

---

## 2. HR Dashboard and Attendance Board

### Role
`HR` (also accessible in read-only mode to `ADMIN`).

### Copy-Paste Google Stitch Prompt
```text
Design the operational HR Dashboard and Daily Attendance Board for "HCM Lite", tailored for human resource managers managing daily employee attendance, punctuality, and pending approvals.

Visual & Layout Requirements:
1. Operational Header:
   - Title: "HR Operations Hub" with today's live date and status badge "Working Day (09:00 - 18:00)".
   - Filter bar: Department dropdown filter ("All Departments", "Engineering", "HR", "Finance") and Date picker defaulting to Today.
   - Primary action: "Generate AI Daily Briefing" button.
2. Operational KPI Cards (5-column grid on desktop, 2-column mobile):
   - Card 1: "Total Headcount" (icon: Users, e.g. "48").
   - Card 2: "Present Today" (icon: CheckCircle2, e.g. "42", emerald color).
   - Card 3: "Late Arrivals" (icon: Clock, e.g. "4", amber color, checked in after 09:15).
   - Card 4: "On Leave" (icon: Calendar, e.g. "2", blue color).
   - Card 5: "Pending Approvals" (icon: AlertCircle, e.g. "3", rose color badge indicating action needed).
3. Attendance Trends & Late Comers (2-column section):
   - Left: "7-Day Attendance Trend" — Multi-line or area chart showing Present vs Late vs Absent over the last 7 calendar days.
   - Right: "Top Late-Comers This Month" — Ranking list of the top 5 employees with late check-ins (>09:15), showing avatar, name, department, and late arrival count badge.
4. Daily Attendance Board Table:
   - Search bar ("Search employee code or name...") and Status filter pills (All, Present, Late, Half-Day, Absent, On Leave, Missing Checkout).
   - Table columns: Employee Code, Employee Name & Avatar, Department, Check-In Time (with red badge if >09:15), Check-Out Time, Total Worked Hours, Geofence Verification Status (green check "Within 150m" or red warning), and Action button ("Review Correction").
   - "Missing Checkout" indicator badge for past dates where check-in was recorded without a check-out.
5. Interaction & Feedback:
   - Hover row highlighting, skeleton shimmer during data fetching, clean empty state when no employees match filters.
```

### Components & Layout
- Filter Bar (Department select, Date picker).
- 5 KPI summary tiles.
- 7-day Attendance Trend chart (Recharts AreaChart).
- Top 5 Late Comers ranking card.
- Attendance Board data table with status badges and geofence verification indicator.

### API Connection Notes
- Daily board records and summary metrics load from `GET /api/attendance/board?date=YYYY-MM-DD&departmentId=...`.
- Overall trends and late comers load from `GET /api/analytics` (HR role).

---

## 3. Employee Self-Service Dashboard

### Role
`EMPLOYEE`

### Copy-Paste Google Stitch Prompt
```text
Design the Employee Self-Service Dashboard for "HCM Lite", crafted for individual team members to record their daily attendance, track working hours, review leave quotas, and access payslips.

Visual & Layout Requirements:
1. Welcome Banner:
   - Personalized greeting: "Good morning, [Employee Name]!" with current time, date, and office start rule note: "Office start: 09:00 AM (15m grace period)".
2. Interactive Check-In / Check-Out Widget (Hero Component):
   - Prominent elevated card with live digital clock.
   - If not checked in: Large emerald button "Check In Now" with GPS location indicator ("Office Geofence: 24.8607° N, 67.0011° E • In Range") and optional camera verification icon.
   - If checked in: Shows "Checked in at 09:02 AM • On Time", running worked-hours timer, and a secondary action button "Check Out".
   - Status badge indicating today's state: "PRESENT", "LATE" (if after 09:15), or "HALF DAY" (if worked < 5.0 hours upon checkout).
3. Weekly Working Hours Progress Card:
   - Displays "Weekly Worked Hours" progress bar comparing current week hours (e.g. "32.5 hrs") against the standard 40.0-hour reference target.
   - Monthly late arrivals counter pill: "Lates this month: 1 / 3 allowable".
4. Leave Balance Quota Cards (Horizontal 3-card grid):
   - Annual Leave: "11 / 14 days remaining" with circular progress ring.
   - Sick Leave: "7 / 8 days remaining" with circular progress ring.
   - Casual Leave: "9 / 10 days remaining" with circular progress ring.
   - Action: "Apply for Leave" and "Smart AI Leave Request" buttons.
5. Latest Payslip Snapshot Card:
   - Card showing latest finalized payslip: Month/Year (e.g. "October 2026"), Net Salary ("PKR 125,450"), and a quick action link: "View & Download Payslip (PDF)".
6. Company Announcements Carousel:
   - Feed of latest company announcements with priority tags (Normal, High, Urgent) and publication dates.
```

### Components & Layout
- Hero Clock-In/Out Card with Geofence & Status Badge.
- Weekly Hours Progress Bar (40h standard).
- Leave Quota Progress Rings (Annual, Sick, Casual).
- Latest Payslip Card with download action.
- Announcements Feed.

### API Connection Notes
- Dashboard stats load from `GET /api/analytics` (Employee role).
- Check-in calls `POST /api/attendance/check-in` (with optional lat/lng).
- Check-out calls `POST /api/attendance/check-out`.
- Payslip link routes to `/employee/payslips/[id]`.

---

## 4. Login Page

### Role
Public / Unauthenticated.

### Copy-Paste Google Stitch Prompt
```text
Design an ultra-clean, trustworthy, and enterprise-grade Login Screen for "HCM Lite — AI-Assisted Human Capital Management".

Visual & Layout Requirements:
1. Dual-Sided Layout (Split screen on desktop, single centered column on mobile):
   - Left Side (Brand & Product Showcase, 55% width):
     • Deep emerald/slate gradient backdrop (#064e3b to #022c22) with subtle geometric grid patterns.
     • HCM Lite brand logo with glowing emerald effect.
     • Headline: "Intelligent Human Capital Management for Modern Workforces".
     • 3 feature callouts with glassmorphism cards:
       1. "Automated Punctuality & Geofenced Attendance"
       2. "Progressive Tax & Transparent Monthly Payroll"
       3. "Server-Governed AI Copilot & Smart Leave Filing"
     • Hackathon edition badge: "Saylani Hackathon 2026 Official Build".
   - Right Side (Authentication Form, 45% width, clean white canvas):
     • Title: "Sign In to Your Workspace".
     • Subtitle: "Enter your company email and password to access your dashboard".
     • Form inputs:
       - Email Address field with email icon prefix and clear placeholder ("name@company.com").
       - Password field with password icon prefix, hide/show eye toggle button, and "Forgot Password?" link.
     • Primary Submit Button: Full-width deep emerald button "Sign In" with subtle hover lift and loading spinner state.
     • Demo Role Quick-Switcher Bar (Hackathon Judging Feature):
       - A distinct, helpful judging helper box: "Quick Demo Logins (Click to autofill):"
       - 3 interactive pill buttons: [Admin: admin@hcmlite.com], [HR Manager: hr@hcmlite.com], [Employee: emp@hcmlite.com].
     • Footer: Security note "Protected by HTTP-only JWT sessions & bcrypt encryption • Need setup? Configure Initial Workspace".
2. Error & Validation States:
   - Inline field error message in rose-600.
   - Alert banner for deactivated accounts: "This account has been deactivated. Please contact your administrator."
   - Mandatory password change redirect note for first-time employee logins.
```

### Components & Layout
- Split-screen layout (Brand showcase left, login form right).
- Email & password inputs with validation states.
- Demo role quick-switcher pills for judges.
- First-run setup redirect link.

### API Connection Notes
- Form submission calls `POST /api/auth/login`.
- If `mustChangePassword === true`, redirects to `/change-password`.
- Otherwise redirects to role dashboard (`/admin`, `/hr`, or `/employee`).

---

## 5. First-Run Setup Wizard

### Role
First-time Administrator / Initial Onboarding.

### Copy-Paste Google Stitch Prompt
```text
Design a multi-step, beautifully guided First-Run Company Setup Wizard for "HCM Lite". This wizard allows judges or administrators opening a fresh installation to initialize the organization, office hours, geofence, and administrator credentials in under 2 minutes.

Visual & Layout Requirements:
1. Wizard Shell:
   - Centered card container (max-w-2xl) on a subtle slate-50 background.
   - Top brand mark: HCM Lite icon + "Initial Workspace Setup".
   - Step progress indicator (3 steps):
     • Step 1: "Company Profile" (Active/Done)
     • Step 2: "Office & Geofence Rules" (Active/Upcoming)
     • Step 3: "Administrator Account" (Upcoming)
2. Step 1 — Company Profile:
   - Company Legal Name (input e.g. "Saylani Tech Ventures").
   - Official Contact Email & Phone.
   - Industry & Country (default: Pakistan / PKR currency).
3. Step 2 — Office & Punctuality Rules:
   - Office Start Time picker (default: "09:00 AM").
   - Grace Period slider or number input (default: "15 minutes" — arrival after 09:15 is flagged late).
   - Half-Day Minimum Worked Hours (default: "5.0 hours").
   - Weekend Days Multi-select pills: [Saturday - selected], [Sunday - selected], [Friday].
   - Office GPS Coordinates: Latitude (default 24.8607) & Longitude (default 67.0011).
   - Geofence Radius input (default: "150 meters").
   - Leave Quotas Preview card showing default quotas: Annual (14 days), Sick (8 days), Casual (10 days), Unpaid (unlimited).
4. Step 3 — Administrator Account:
   - Admin Full Name.
   - Admin Login Email (e.g. "admin@hcmlite.com").
   - Master Password & Confirm Password (min 8 characters).
5. Footer Actions:
   - "Back" button, Step indicator ("Step 2 of 3"), and Emerald "Continue / Complete Setup" button with loading spinner.
6. Completion Screen:
   - Green checkmark animation with title "Company Successfully Initialized!", summary of generated departments (Engineering, HR, Finance) and leave types, and "Proceed to Login" button.
```

### Components & Layout
- 3-step progress stepper.
- Form controls with defaults matching the hackathon specification.
- Geofence & Office hours configuration cards.
- Success confirmation screen.

### API Connection Notes
- Verification check calls `GET /api/auth/setup` to ensure setup is needed.
- Completion submits `POST /api/auth/setup` which initializes Company, OrgSettings, LeaveTypes, Departments, Designations, and the Admin User transactionally.

---

## 6. Employee Management and Employee Profile (360 View)

### Role
`HR` and `ADMIN` (View/Edit), `EMPLOYEE` (View own 360 profile & edit phone/address).

### Copy-Paste Google Stitch Prompt
```text
Design the Employee Directory and the comprehensive "Employee 360 Profile" for "HCM Lite".

Visual & Layout Requirements:

Part A: Employee Directory View (/hr/employees)
1. Header Bar:
   - Title: "Employee Directory" with count badge (e.g. "48 Active Employees").
   - Action buttons: "Export CSV" (outline button), "Import CSV" (secondary button with dry-run badge), and "+ Add Employee" (primary emerald button).
2. Filter & Search Toolbar:
   - Live search input ("Search by name, code, email...").
   - Department dropdown filter, Designation filter, and Status filter pills (Active, Probation, On Leave, Terminated).
3. Employee Table & Grid Toggle:
   - Table headers: Employee Code, Name & Avatar, Department, Designation, Joining Date, Employment Status, Gross Salary (visible to HR/Admin), and Action menu (...).
   - Pagination footer: "Showing 1 to 10 of 48 records", page buttons, and rows-per-page selector.
4. CSV Import Modal Drawer:
   - File upload dropzone (.csv files).
   - "Dry-Run Validation Report" toggle: When checked, validates duplicate codes, duplicate emails, invalid dates, and negative salaries without importing, presenting a clear summary table of valid rows vs errors (Row #, Field, Reason).
   - Safe Import confirmation button.

Part B: Employee 360 Profile View (/hr/employees/[id] or /employee/profile)
1. Profile Header Banner:
   - Large avatar, employee full name, employee code badge ("EMP-001"), status badge ("ACTIVE"), department, designation, and joining date.
   - Top-right action: "Edit Profile" (HR can edit all fields; Employee can only edit phone and address).
2. Tabbed Information Architecture (4 tabs):
   - Tab 1: "Personal & Job Details" — Contact email, phone, physical address, gender, date of birth, emergency contact.
   - Tab 2: "Salary Structure" — Basic Salary, HRA Allowance (40%), Medical Allowance (10%), and Gross Monthly Salary (1.5x Basic) with annualized tax estimate card.
   - Tab 3: "Attendance History" — Calendar heat-map and recent check-in/out logs with status indicators (Present, Late, Half-Day).
   - Tab 4: "Leave Balances & History" — Quota breakdown (Annual, Sick, Casual, Unpaid) and table of past leave applications with statuses.
```

### Components & Layout
- Directory table with sorting, search, and pagination.
- CSV Import Modal with pre-flight dry-run validation report.
- Employee 360 Profile with 4 tabs (Overview, Salary, Attendance, Leaves).
- Modal for self-service editing (restricted to phone & address for employees).

### API Connection Notes
- Directory loads via `GET /api/employees?search=...&departmentId=...&page=...`.
- CSV import calls `POST /api/employees/import` (dry-run report or transactional commit).
- CSV export downloads from `GET /api/employees/export`.
- Profile details load via `GET /api/employees/[id]`.

---

## 7. Leave Management and Leave Approval

### Role
`EMPLOYEE` (Apply & Cancel), `HR` / `ADMIN` (Review & Approve/Reject).

### Copy-Paste Google Stitch Prompt
```text
Design the Leave Management workspace for "HCM Lite", including the Employee Leave Request Form, Leave Balance Overview, and the HR Pending Approval Inbox.

Visual & Layout Requirements:

Part A: Employee Leave Workspace (/employee/leaves)
1. Balance Summary Cards:
   - 4 Cards: Annual Leave (11/14 left), Sick Leave (7/8 left), Casual Leave (9/10 left), Unpaid Leave (0 used, unlimited).
   - Shows days allocated, days used, days pending approval, and net available days.
2. Actions:
   - Primary Emerald Button: "Apply for Leave".
   - AI Copilot Button: "Smart Natural-Language Leave" (triggers natural language input e.g. "I need next Monday and Tuesday off for my sister's wedding").
3. Leave Application Form Modal:
   - Leave Type selector (Annual, Sick, Casual, Unpaid).
   - Start Date & End Date pickers with auto-calculated "Working Days" indicator that automatically excludes weekends (Saturday/Sunday) and public holidays.
   - Reason text area.
   - Client & server validation note: "Overlapping leave dates and requests exceeding remaining balance will be rejected (HTTP 422)."
4. My Leave History Table:
   - Columns: Leave Type, Start Date, End Date, Total Days, Reason, Status badge (PENDING, APPROVED, REJECTED, CANCELLED), Decision Date & HR Comment.
   - "Cancel Request" action button for eligible pending requests.

Part B: HR Leave Approval Inbox (/hr/leaves)
1. Pending Requests Inbox:
   - Counter badge: e.g. "3 Pending Approvals".
   - List of pending cards displaying Employee avatar, Name, Department, Requested Dates, Computed Working Days, Reason, and Current Remaining Balance.
   - Two prominent action buttons on each card:
     • Green "Approve" button.
     • Red "Reject" button (opens mandatory rejection comment dialog).
2. Action Modal:
   - Dialog for HR to add optional approval note or mandatory rejection reason before submitting decision.
   - Shows feedback notice: "Employee will be notified instantly via in-app notification."
```

### Components & Layout
- Leave Quota Summary Cards (Allocated, Used, Pending, Available).
- Leave Application Modal with auto-calculated working days.
- Smart Leave AI Extraction drawer.
- HR Pending Approval cards with Approve/Reject modal dialogs.
- Leave History table with cancel action for pending items.

### API Connection Notes
- Leave types load via `GET /api/leave/types`.
- Balances load via `GET /api/leave/balances`.
- Applications submit via `POST /api/leave/requests`.
- Review actions submit via `PATCH /api/leave/requests/[id]`.
- Cancellations submit via `DELETE /api/leave/requests/[id]`.

---

## 8. Payroll Management and Payslip

### Role
`HR` (Draft & Review), `ADMIN` (Finalize & Lock), `EMPLOYEE` (View & Download personal payslips).

### Copy-Paste Google Stitch Prompt
```text
Design the Payroll Lite Management workspace and the official Printable/Downloadable PDF Payslip for "HCM Lite".

Visual & Layout Requirements:

Part A: Monthly Payroll Processing (/hr/payroll)
1. Payroll Run Controls:
   - Month & Year selector (e.g. "October 2026").
   - Action Button: "Generate Payroll Draft" (accessible to HR and Admin).
   - Status Banner:
     • If DRAFT: Blue banner "Draft Payroll Generated • Review employee deductions before finalization".
     • If FINALIZED: Emerald locked banner with lock icon: "Payroll Finalized & Locked by Admin on 24 Oct 2026 • Records are immutable".
   - Finalization Action: Prominent Emerald Button "Finalize & Lock Payroll" — VISIBLE TO ADMIN ONLY. Disabled or hidden for HR with tooltip "Only Administrator can finalize payroll".
2. Payroll Summary KPI Cards:
   - Total Employees Paid (e.g. "48").
   - Total Gross Payroll (e.g. "PKR 7,200,000").
   - Total Attendance & Unpaid Deductions (e.g. "PKR 142,500").
   - Total Tax Withheld (e.g. "PKR 284,000").
   - Net Disbursement (e.g. "PKR 6,773,500").
3. Employee Payroll Breakdown Table:
   - Columns: Employee Code, Name, Department, Basic Salary, HRA (40%), Medical (10%), Gross Salary (1.5x), Working Days, Absent Days, Unpaid Leave Days, Half Days (0.5 deduction), Attendance Deductions, Monthly Tax Withholding, Net Salary, and Action ("View Payslip").

Part B: Official Employee Payslip View & PDF Print Layout (/employee/payslips/[id])
1. Professional Payslip Sheet (Standard 8.5x11 / A4 aspect ratio, clean white paper canvas with subtle border):
   - Company Header: Company Name, Official Address, Tax ID, and Title "OFFICIAL SALARY PAYSLIP — OCTOBER 2026".
   - Employee Details Box (2-column layout):
     • Left: Employee Name, Employee ID, Designation, Department.
     • Right: Bank Account, Joining Date, Total Working Days, Days Worked.
   - Dual-Column Earnings & Deductions Table:
     • Earnings Column: Basic Salary, House Rent Allowance (40%), Medical Allowance (10%), Gross Total.
     • Deductions Column: Absenteeism Deductions, Unpaid Leave Deductions, Half-Day Deductions, Income Tax Deduction (Progressive Slabs), Total Deductions.
   - Net Pay Highlight Box: Large bold text "NET SALARY PAYABLE: PKR 125,450" (with amount in words: "One Hundred Twenty-Five Thousand Four Hundred Fifty Rupees Only").
   - Security & Authenticity Footer: "System-generated payroll document • Verified by HCM Lite • Locked & Finalized".
2. Print & Download Controls:
   - Top action bar (hidden during print): "Print Payslip" button (invoking window.print() with clean `@media print` CSS rules) and "Download PDF" button.
```

### Components & Layout
- Payroll Run Selector (Month/Year) & Status Banner (DRAFT vs FINALIZED).
- 5 Payroll Summary KPI tiles.
- Payroll Items table with transparent deduction breakdowns.
- Official Printable Payslip view formatted for A4 print.

### API Connection Notes
- Payroll runs load via `GET /api/payroll/runs`.
- Draft generation calls `POST /api/payroll/runs`.
- Admin finalization calls `POST /api/payroll/runs/[id]`.
- Individual payslips load via `GET /api/payroll/payslips/[id]` (strictly scoped to the authenticated employee or HR/Admin).

---

## 9. Announcements and Notifications

### Role
Shared by all roles (`ADMIN`, `HR`, `EMPLOYEE`).

### Copy-Paste Google Stitch Prompt
```text
Design the Announcements Feed and Notification Center for "HCM Lite".

Visual & Layout Requirements:

Part A: Company Announcements (/announcements)
1. Header Bar:
   - Title: "Company Announcements & Broadcasts".
   - Action: "+ Post Announcement" button (visible to Admin and HR only).
2. Create Announcement Modal (Admin/HR):
   - Title input.
   - Content rich-text or formatted text area.
   - Priority selector pills: [LOW - slate], [NORMAL - blue], [HIGH - amber], [URGENT - rose].
   - Target Audience selector: [All Staff], [HR Only], [Employees Only].
   - "Publish Broadcast" button.
3. Announcements Feed:
   - Stream of modern broadcast cards.
   - Each card displays Priority badge (e.g. "URGENT" in rose pill), Title in bold 16px, Author name & role, publication timestamp, and clean formatted content.
   - Empty state: "No active announcements. Check back later for company updates."

Part B: In-App Notification Center (Drawer / Dropdown)
1. Popover Layout:
   - Header with "Notifications" title, unread count badge, and "Mark all as read" link.
   - Categorized notifications with dedicated icons:
     • Leave Decisions (Calendar icon, emerald for approved, rose for rejected).
     • Payroll Availability (Banknote icon, "Your payslip for Oct 2026 is ready").
     • Attendance Correction Decisions (Clock icon).
     • Company Announcements (Megaphone icon).
   - Timestamp for each notification (e.g. "5m ago", "Yesterday").
   - Clickable cards linking directly to the relevant record.
```

### Components & Layout
- Announcement broadcast feed with priority pills.
- Create Announcement modal for Admin & HR.
- Notification Drawer with categorization icons and read/unread status indicators.

### API Connection Notes
- Announcements load from `GET /api/announcements` and post via `POST /api/announcements`.
- Notifications load from `GET /api/notifications` and update via `PATCH /api/notifications`.

---

## 10. AI HR Assistant

### Role
Shared by all roles, dynamically adapted to user permissions:
- `ADMIN`: Company-wide headcount, department payroll burn, attrition, and policy rules.
- `HR`: Daily attendance status, late-comers, leave utilization, and directory search.
- `EMPLOYEE`: Personal leave balances, personal attendance hours, and policy Q&A (strictly blocked from peer salaries).

### Copy-Paste Google Stitch Prompt
```text
Design the interactive "AI HR Copilot" interface for "HCM Lite", including the slide-over Chat Drawer and the Smart Natural-Language Leave Modal.

Visual & Layout Requirements:

Part A: Slide-Over AI Copilot Drawer
1. Drawer Container:
   - Fixed 384px slide-over panel on the right side of the screen with a clean white surface and soft drop shadow.
   - Header: Emerald AI sparkles icon, title "HCM Lite Copilot", subtitle "Server-Governed Tools Active", and close (X) button.
2. Suggested Quick-Prompt Chips (Role-Specific):
   - For Admin: ["What is our total payroll cost?", "Show headcount by department", "What is our YTD attrition?"]
   - For HR: ["Who is on leave today?", "Show top late-comers this month", "How many approvals are pending?"]
   - For Employee: ["How many leaves do I have left?", "What is the office grace period?", "Roman Urdu: Meri chuttiyan kitni bachi hain?"]
3. Chat Conversation Stream:
   - User messages: Emerald pill bubble aligned to the right.
   - Assistant messages: Slate-100 bubble aligned to the left with an AI bot avatar icon.
   - Server Tool Execution Badge: Subtle badge below the answer: "⚡ Executed server tool: get_attendance_summary • Verified database record".
   - "AI-generated" disclaimer footer in 9px slate-400 text.
4. Security Boundary Feedback:
   - When an employee asks for a colleague's salary: Shows polite, firm refusal card: "Access Denied: Under company confidentiality rules, employees cannot view salary information of other staff members."
5. Input Bar:
   - Pinned bottom bar with pill input, placeholder ("Ask a policy question or query live records..."), and emerald send button.

Part B: Smart Leave Natural-Language Extraction Modal
1. Plain-Language Input Screen:
   - Title: "Smart Leave Filing with AI".
   - Textarea with placeholder: "e.g. I need next Monday and Tuesday off for my sister's wedding."
   - "Extract Details" emerald button with loading spinner ("Analyzing dates & leave quotas...").
2. Extracted Data Review Card:
   - Clean prefilled form displaying:
     • Inferred Leave Type dropdown (e.g. "Casual Leave").
     • Start Date picker (e.g. "2026-10-26").
     • End Date picker (e.g. "2026-10-27").
     • Calculated Working Days (e.g. "2 days • Weekend excluded").
     • Reason text input ("Sister's wedding").
   - Explicit confirmation notice: "Please review and confirm. AI never submits or approves requests automatically."
   - Actions: "Edit Prompt" link and "Confirm & Apply" emerald button.
```

### Components & Layout
- Slide-over Chat Drawer (384px width).
- Role-specific suggestion chips.
- Tool execution indicators.
- Smart Natural Language Leave extraction and review modal.

### API Connection Notes
- Chat queries post to `POST /api/ai/chat` (rate limited to ~25 req/user/hr, 15s timeout, audit logged in `ai_logs`).
- Smart leave extraction calls `POST /api/ai/smart-leave`.
- Confirmed leave submissions call `POST /api/leave/requests`.

---

## Summary of Design Tokens Reference for Google Stitch

| Token Name | Value | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#f8fafc` (slate-50) | Main background |
| **Surface / Cards** | `#ffffff` (white) | Elevated cards & tables |
| **Border Color** | `#e2e8f0` (slate-200) | Subtle container outlines |
| **Text Primary** | `#0f172a` (slate-900) | Headings & titles |
| **Text Secondary** | `#64748b` (slate-500) | Subtitles & helper text |
| **Primary Accent** | `#059669` (emerald-600) | Primary CTA buttons, check-in, active navigation |
| **Primary Hover** | `#047857` (emerald-700) | Button hover state |
| **Secondary Accent**| `#14b8a6` (teal-500) | Accents, progress bars, gradient stops |
| **Success Badge** | Bg: `#ecfdf5`, Text: `#047857` | Present, Approved, Finalized |
| **Warning Badge** | Bg: `#fffbeb`, Text: `#b45309` | Late, Pending |
| **Danger Badge** | Bg: `#fff1f2`, Text: `#be123c` | Absent, Rejected, Errors |
| **Info / Draft** | Bg: `#eff6ff`, Text: `#1d4ed8` | Draft payroll, Info notices |
| **Border Radius** | `12px` (rounded-xl) / `16px` (rounded-2xl) | Cards, modals, buttons |
| **Shadow** | `0 1px 3px rgba(0,0,0,0.05)` | Subtle, clean elevation |

---

*This document is ready for copy-pasting directly into Google Stitch for generating high-fidelity UI designs.*
