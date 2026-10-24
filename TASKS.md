# HCM Lite — Master Task Checklist

## Phase 0: Workspace Audit, Setup & Specification
- [x] Inspect workspace and environment (Node 24.22, Git initialized)
- [x] Create PRD.md
- [x] Create ARCHITECTURE.md
- [x] Create RULES.md
- [x] Create DESIGN.md
- [x] Create TASKS.md
- [x] Create MEMORY.md
- [ ] Initialize Next.js project with App Router, TypeScript strict mode, and Tailwind CSS

## Phase 1: Foundation & Auth (M1)
- [ ] Configure Prisma schema with all 17+ models
- [ ] Implement database client and seeding/bootstrap utilities
- [ ] Implement password hashing (bcryptjs) & JWT auth service with HTTP-only cookies
- [ ] First-run setup API (`/api/auth/setup`) and guided first-run onboarding screen
- [ ] Login API (`/api/auth/login`) with role-based routing (`ADMIN`, `HR`, `EMPLOYEE`)
- [ ] Mandatory password change API (`/api/auth/change-password`) for initial employee logins
- [ ] Session validation API (`/api/auth/me`) & logout API (`/api/auth/logout`)
- [ ] Server-side RBAC and record-scope authorization helpers
- [ ] Responsive navigation shell & role-specific layouts

## Phase 2: Organization Setup (M2) & Employee Management (M3)
- [ ] Organization settings API & Admin configuration interface (office hours, grace, weekends, geofence)
- [ ] Departments & Designations CRUD APIs and management UI
- [ ] Leave types and public holidays configuration
- [ ] User management for Admin (create/toggle HR accounts, reset passwords)
- [ ] Employee registration by HR with temporary password generation
- [ ] Employee directory with search, department filtering, pagination, and status filters
- [ ] Employee 360 profile view (personal, job, attendance, leave balance, payslips)
- [ ] Employee self-service profile edit (phone & address only)
- [ ] CSV dry-run validation report & transactional bulk import
- [ ] CSV export with formula injection sanitization

## Phase 3: Attendance Management (M4) & Leave Management (M5)
- [ ] Web check-in & check-out API with server-generated timestamps & 409 duplicate check
- [ ] Attendance rules engine (late arrival >09:15, half-day <5h, missing check-out, expected working days)
- [ ] Employee personal attendance calendar & check-in widget
- [ ] HR daily attendance board with date & department filters
- [ ] Attendance correction request submission (Employee) & review/approval (HR)
- [ ] Working days calculator excluding configured weekends & public holidays
- [ ] Leave application API with overlap detection & quota balance verification (HTTP 422)
- [ ] HR pending approval inbox with approval/rejection comments & notifications
- [ ] Employee leave balances and history display

## Phase 4: Payroll Lite (M6)
- [ ] Salary structure model & assignment (Basic, HRA 40%, Medical 10%, Gross 1.5x)
- [ ] Payroll calculation engine (per-day rate, absent/half-day/unpaid deductions, joining proration)
- [ ] Annualized progressive tax calculator (PKR slabs) and monthly deduction
- [ ] Monthly payroll draft generation by HR (re-calculable before finalization)
- [ ] Admin payroll finalization & lock workflow (immutable once locked)
- [ ] Employee payslip view and printable / downloadable PDF endpoint with strict employee scoping

## Phase 5: Dashboards, Analytics (M7) & Communications/Audit (M9)
- [ ] Server-side analytics KPI calculation service (accurate, zero fake metrics)
- [ ] Admin dashboard (headcount, YTD attrition, payroll cost, avg salary, department charts, audit feed)
- [ ] HR dashboard (today's attendance stats, pending approvals, late-comers, absenteeism, leave stats)
- [ ] Employee dashboard (check-in widget, weekly hours, late count, leave balances, recent payslip)
- [ ] Company announcements (create by Admin/HR, view by all)
- [ ] In-app notification center (leave decisions, payslips, announcements)
- [ ] Immutable audit log API and Admin viewer with before/after state inspection

## Phase 6: Enterprise AI Assistant (M8) & Bonus Features
- [ ] Configurable AI client (API key, base URL, model name, 15s timeout, rate limiter)
- [ ] Tool registry with server-side authorization:
  - `get_headcount`
  - `get_attendance_summary`
  - `get_late_comers`
  - `get_leave_summary`
  - `get_my_leave_balance`
  - `get_payroll_summary`
  - `search_employees`
- [ ] Interactive AI chat assistant with role-scoped responses
- [ ] Dashboard AI summary generation
- [ ] Smart Natural Language Leave Form extraction (date parsing, leave type matching, form prefill)
- [ ] Company Policy Q&A grounded in database settings
- [ ] AI execution logging in `ai_logs`
- [ ] Optional bonus features: Roman Urdu support, Camera attendance / face check, GPS Haversine validation

## Phase 7: Verification, Automated Testing & Polishing
- [ ] Unit & service tests (tax calculation, working days, attendance status, leave balances)
- [ ] Authorization & permission boundary tests (Employee blocked from peer data, HR blocked from finalization)
- [ ] End-to-end judging workflow verification (5-minute demonstration flow)
- [ ] Type check (`tsc --noEmit`), lint check, and production build verification (`npm run build`)

## Phase 8: Deployment & Handover
- [ ] Create comprehensive `.env.example`
- [ ] Finalize `README.md` with full setup, judging script, and architecture guide
