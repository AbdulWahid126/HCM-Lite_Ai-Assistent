# HCM Lite — System Architecture

### 1. Technology Architecture
- **Framework**: Next.js 15+ (App Router) with React 19, TypeScript strict mode.
- **Styling**: Tailwind CSS, custom design tokens, Lucide React icons, and Recharts.
- **ORM & Database**: Prisma ORM with flexible support for PostgreSQL (Supabase/Neon/Self-hosted) and SQLite for zero-dependency local runs and automated testing.
- **Authentication**: JWT stored in HTTP-only, secure, SameSite=Lax cookies, verified server-side with `jose` / `jsonwebtoken`, passwords hashed with `bcryptjs`.
- **Validation**: Zod schemas for all API payloads, query parameters, and form inputs.
- **PDF Generation**: Native standard HTML print stylesheet & PDF generation endpoints for payslips.
- **AI Integration**: Server-side tool execution pipeline supporting OpenAI / Google Gemini / Anthropic compatible endpoints with structured JSON tool calls, strict permission scoping, and schema validation.

### 2. Directory Structure
```
d:\Hackathon_Night_project\
├── src\
│   ├── app\                       # Next.js App Router (pages, layouts, route handlers)
│   │   ├── (auth)\                # Authentication routes (login, setup, change-password)
│   │   ├── (dashboard)\           # Protected app routes
│   │   │   ├── admin\             # Admin views (settings, users, audit, payroll finalization)
│   │   │   ├── hr\                # HR views (directory, attendance board, leave inbox, payroll drafts)
│   │   │   ├── employee\          # Employee self-service (check-in, calendar, my leaves, payslips)
│   │   │   └── layout.tsx         # Shared responsive app shell with role navigation & notifications
│   │   ├── api\                   # REST-style Route Handlers
│   │   │   ├── auth\              # Login, logout, setup, change-password, me
│   │   │   ├── org\               # Company settings, departments, designations, holidays
│   │   │   ├── employees\         # CRUD, CSV import/export, profile
│   │   │   ├── attendance\        # Check-in, check-out, board, corrections
│   │   │   ├── leave\             # Applications, balances, approvals/rejections
│   │   │   ├── payroll\           # Calculation, drafts, finalize, payslips
│   │   │   ├── analytics\         # Role-scoped KPI metrics
│   │   │   ├── ai\                # Chat, tools execution, smart-leave, summaries
│   │   │   ├── notifications\     # In-app notifications
│   │   │   └── audit\             # Immutable audit log queries (Admin only)
│   │   ├── layout.tsx             # Root layout with font and metadata
│   │   ├── page.tsx               # Root redirector / landing portal
│   │   └── globals.css            # Tailored design system, tokens, glassmorphism
│   ├── components\                # Reusable UI primitives (Button, Modal, Table, Badge, Card, etc.)
│   ├── features\                  # Domain-specific UI modules (AttendanceWidget, LeaveForm, etc.)
│   ├── lib\                       # Shared utilities (prisma, auth, dates, export-sanitizer)
│   └── server\                    # Backend core logic
│       ├── auth\                  # Token signing, cookie management, session extraction
│       ├── permissions\           # Role and record-scope authorizers
│       ├── services\              # Pure business logic services (Attendance, Payroll, Leave, etc.)
│       ├── analytics\             # Server-side metric formulas
│       └── ai\                    # AI client, prompt templates, tool registry, execution guardrails
├── prisma\
│   └── schema.prisma              # Unified database models
├── tests\                         # Unit, service, and integration tests
├── .env.example                   # Clear configuration template
└── README.md
```

### 3. Data Flow & Security Model
1. **Client Request**: Passes through Next.js middleware and route handlers.
2. **Authentication Gate**: Reads HTTP-only cookie, decodes JWT, verifies user active status in database.
3. **Authorization Gate**: Validates required role (`ADMIN`, `HR`, `EMPLOYEE`) and resource ownership (`employeeId == session.employeeId` for employees).
4. **Input Validation**: Zod parses and sanitizes request body/query.
5. **Business Service Layer**: Executes core domain calculations (e.g. tax slabs, working day diffs, geofence Haversine).
6. **Data Access & Audit**: Prisma transactions commit changes and synchronously write immutable audit records to `AuditLog`.
7. **Safe Response**: Strips password hashes, internal secrets, and unpermitted fields.
