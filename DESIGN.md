# HCM Lite — Design System & UI/UX Specification

### 1. Visual Language & Brand
- **Aesthetic**: Premium enterprise HR SaaS platform with clean slate surfaces, crisp typography, and an emerald/teal jewel tone accent representing growth and vitality (`emerald-600` / `teal-600`).
- **Typography**: Inter / Outfit sans-serif font stack with high readability at all sizes, explicit optical letter-spacing, and clear font weights (400, 500, 600, 700).
- **Surfaces**: Layered card containers with subtle borders (`border-slate-200 / border-slate-800`), gentle dropshadows (`shadow-xs` / `shadow-sm`), and subtle glassmorphic elements for elevated panels.
- **Color Palette**:
  - Background: `bg-slate-50` (light) / `bg-slate-950` (dark)
  - Card & Surfaces: `bg-white` / `bg-slate-900`
  - Text Primary: `text-slate-900` / `text-slate-100`
  - Text Secondary: `text-slate-500` / `text-slate-400`
  - Accent Primary: `bg-emerald-600` hover `bg-emerald-700` (`#059669`)
  - Accent Secondary: `bg-teal-500` (`#14b8a6`)
  - Status Indicators:
    - Present/Approved/Finalized: `bg-emerald-50 text-emerald-700 border-emerald-200`
    - Late/Pending: `bg-amber-50 text-amber-700 border-amber-200`
    - Absent/Rejected/Error: `bg-rose-50 text-rose-700 border-rose-200`
    - Info/Draft: `bg-blue-50 text-blue-700 border-blue-200`

### 2. Interaction Principles
- Responsive layout starting at 375px mobile width up to 4K displays.
- Collapsible sidebar for tablet/mobile with persistent top navigation.
- Skeletons and micro-spinners for all asynchronous fetch operations.
- Accessible modal dialogs with focus traps, escape key listeners, and accessible `aria-labelledby`.
- Clear, empathetic zero-state views with actionable buttons (e.g. "No pending leaves — You're all caught up!").
- Toast notification drawer for asynchronous actions (e.g. "Check-in recorded at 09:02 AM").
- Printable payslip view optimized for 8.5x11 / A4 paper with clean print CSS rules (`@media print`).
