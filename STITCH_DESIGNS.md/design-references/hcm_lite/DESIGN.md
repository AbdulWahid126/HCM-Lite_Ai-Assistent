---
name: HCM Lite
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3e4943'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#6e7a73'
  outline-variant: '#bdc9c1'
  surface-tint: '#006c4e'
  primary: '#005d42'
  on-primary: '#ffffff'
  primary-container: '#047857'
  on-primary-container: '#9ffdd3'
  inverse-primary: '#7bd8b1'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#005d3f'
  on-tertiary: '#ffffff'
  tertiary-container: '#007853'
  on-tertiary-container: '#8fffcb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#97f5cc'
  primary-fixed-dim: '#7bd8b1'
  on-primary-fixed: '#002115'
  on-primary-fixed-variant: '#00513a'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Outfit
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-semibold:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
  metric-stat:
    fontFamily: Outfit
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-mobile: 0.75rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system establishes a high-performance, modern B2B SaaS interface tailored for people operations, payroll, and workforce orchestration. Balancing enterprise precision with consumer-grade software elegance, it mirrors the product polish of platforms like Linear, Gusto, and Rippling. 

The personality is authoritative, calm, and intelligent. The user experience prioritizes dense operational clarity without visual fatigue: high-contrast typography, muted slate foundations, and purposeful jewel-toned signals that instantly orient administrators and employees through mission-critical tasks.

## Colors

The palette leverages a structured slate scale layered with rich emerald and teal jewel accents to denote enterprise confidence, precision, and vitality.

### Functional Surfaces & Neutrals
- **Canvas Base:** `#f8fafc` (Slate 50) defines the outer application background and viewport framing.
- **Card & Sheet Surface:** `#ffffff` provides crisp foreground separation.
- **Structural Borders:** `#e2e8f0` (Slate 200) governs dividers, card frames, and inputs.
- **Primary Text:** `#0f172a` (Slate 900) ensures crisp readability for all primary metrics and table contents.
- **Muted Text & Metadata:** `#64748b` (Slate 500) applies to table headers, timestamps, and secondary captions.

### Accent Hierarchy
- **Primary Jewel Accent:** `#047857` (Deep Emerald) serves as the primary action anchor and focus ring base.
- **Interactive Vibrant Accent:** `#059669` provides interactive button fills, links, and active state indicators.
- **Teal Spark Accent:** `#14b8a6` highlights AI-assisted suggestions, automation indicators, and progress tracks.

### Status Indicators & Lifecycle Tokens
- **Present / Approved:** Fill `#ecfdf5`, Border `#a7f3d0`, Text `#047857`
- **Late / Pending:** Fill `#fffbeb`, Border `#fde68a`, Text `#b45309`
- **Absent / Rejected:** Fill `#fff1f2`, Border `#fecdd3`, Text `#be123c`
- **Draft / Information:** Fill `#eff6ff`, Border `#bfdbfe`, Text `#1d4ed8`

### Role Badges
- **Admin:** Fill `#f5f3ff`, Border `#ddd6fe`, Text `#6d28d9` (Violet)
- **HR Specialist:** Fill `#f0f9ff`, Border `#bae6fd`, Text `#0369a1` (Sky)
- **Employee:** Fill `#ecfdf5`, Border `#a7f3d0`, Text `#047857` (Emerald)

## Typography

Typography pairs the structural, geometric presence of **Outfit** for metrics, page titles, and modal headers with the high-legibility, tabular-friendly performance of **Hanken Grotesk** across high-density grids, form fields, and administrative reports.

- Use `display-lg` and `metric-stat` strictly for primary dashboard indicators, payroll totals, and major analytics panels.
- Restrict section headers and card titles to `headline-md` (`16px`, `600`) to preserve density.
- Set table data, input text, and conversational AI prompt responses using `body-md` (`14px`) with `body-semibold` allocated to employee names, monetary values, and actionable table cells.
- Apply `label-md` uppercase styling to table column headers, status badges, and metadata tags to enforce scannability.

## Layout & Spacing

The layout implements an adaptive multi-column fluid grid system engineered for administrative dashboards and data-dense enterprise consoles.

### Grid & Density
- **Desktop (1280px+):** 12-column layout with fixed left-hand navigation (240px collapsed to 64px icon rail), `1.5rem` canvas margins, and `1rem` column gutters.
- **Tablet (768px - 1279px):** 8-column layout with collapsable drawer navigation, `1rem` gutters, and `1rem` canvas margins.
- **Mobile (<768px):** Single-column stacked workflow with sticky bottom action controls, `0.75rem` gutters, and `1rem` margins.

### Component Spacing Rhythm
- Vertical table cell padding strictly adheres to `space-md` (`12px`) top/bottom and `space-lg` (`16px`) left/right to achieve dense scanning without touch-target compromise.
- Input controls, dropdown triggers, and buttons use `space-sm` (`8px`) vertical padding and `space-md` (`12px`) horizontal padding.
- Card containers use `space-xl` (`24px`) interior padding for standard forms and `space-lg` (`16px`) for tabular metric widgets.

## Elevation & Depth

Visual depth follows a tactile, low-profile elevation strategy relying primarily on crisp 1px borders complemented by diffused ambient shadows.

### Elevation Levels
- **Level 0 (Flat / Canvas):** Applied to the main application background (`#f8fafc`). No shadow, no border.
- **Level 1 (Card / Resting Surface):** White surface (`#ffffff`) surrounded by a 1px border (`#e2e8f0`) with an ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Dropdowns / Menus / Popovers):** Elevated contextual elements: 1px border (`#e2e8f0`), `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals / Slide-Over Panels / AI Insights):** Centered dialogs and right-hand drawer sheets: 1px border (`#cbd5e1`), `box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.05)`.

### Border Guidelines
Never use heavy dropshadows or borders wider than 1px. Active or focused panels swap the perimeter border from `#e2e8f0` to `#047857` alongside a 3px soft tint ring: `0 0 0 3px rgba(4, 120, 87, 0.12)`.

## Shapes

The design system uses deliberate corner radii corresponding to scale `2` (0.5rem / 8px standard). This structure balances modern software softness with the strict rectangular bounds needed for compact data visualization.

- **Base Controls (`rounded-md` / 0.5rem):** Form inputs, buttons, segmented controls, table row hover highlights, and standard badges.
- **Containers (`rounded-lg` / 1rem):** Cards, modal windows, table wrapper containers, and slide-over drawers.
- **Interactive Badges & Avatars (`rounded-full`):** User profile pictures, numeric count indicators, and status pill badges.

## Components

### Buttons
- **Primary Button:** Background `#059669`, text `#ffffff`, border transparent, radius `0.5rem`, padding `8px 16px`. Hover state `#047857`. Focus state ring `0 0 0 3px rgba(4, 120, 87, 0.2)`.
- **Secondary Button:** Background `#ffffff`, text `#0f172a`, border 1px solid `#e2e8f0`, radius `0.5rem`, padding `8px 16px`. Hover state background `#f8fafc`, border `#cbd5e1`.
- **Ghost / Tertiary Button:** Transparent background, text `#64748b`, radius `0.5rem`, padding `8px 12px`. Hover state text `#0f172a`, background `#f1f5f9`.
- **AI Assist Action Button:** Background `#ffffff`, border 1px solid `#14b8a6`, text `#0f172a` with a leading teal spark icon; hover background `#f0fdfa`.

### Status Badges & Chips
- Structure: Height `22px`, padding `2px 8px`, border-radius `9999px`, font `label-md` (`12px`, 600).
- **Approved / Present:** Background `#ecfdf5`, border 1px solid `#a7f3d0`, text `#047857`.
- **Late / Pending:** Background `#fffbeb`, border 1px solid `#fde68a`, text `#b45309`.
- **Absent / Rejected:** Background `#fff1f2`, border 1px solid `#fecdd3`, text `#be123c`.
- **Draft / System Info:** Background `#eff6ff`, border 1px solid `#bfdbfe`, text `#1d4ed8`.

### Role Tags
- Structure: Height `20px`, padding `1px 6px`, border-radius `4px`, font `label-sm` (`11px`, 600, uppercase).
- **Admin:** Background `#f5f3ff`, border 1px solid `#ddd6fe`, text `#6d28d9`.
- **HR:** Background `#f0f9ff`, border 1px solid `#bae6fd`, text `#0369a1`.
- **Employee:** Background `#ecfdf5`, border 1px solid `#a7f3d0`, text `#047857`.

### Input Fields & Controls
- **Text Inputs & Selects:** Height `36px`, background `#ffffff`, border 1px solid `#e2e8f0`, border-radius `0.5rem`, font `14px`, text `#0f172a`, placeholder text `#94a3b8`. Focus state shifts border to `#047857` with a `3px` ring at `rgba(4, 120, 87, 0.15)`.
- **Checkboxes & Radios:** Dimensions `16px x 16px`, border 1px solid `#cbd5e1`, radius `4px` (checkbox) or `9999px` (radio). Checked state background `#059669`, border `#059669` with white checkmark.

### Tables & Data Grids
- **Header:** Height `36px`, background `#f8fafc`, bottom border 1px solid `#e2e8f0`, text `label-md` uppercase `#64748b`.
- **Rows:** Height `48px`, background `#ffffff`, bottom border 1px solid `#f1f5f9`, hover background `#f8fafc`. Text `body-md` `#0f172a`.
- **Inline Row Actions:** Show on hover only; cluster within the right-most sticky column.

### Cards & Metric Widgets
- Background `#ffffff`, border 1px solid `#e2e8f0`, border-radius `1rem`, padding `20px`.
- Metric numbers use `metric-stat` (`28px`, bold Outfit) stacked directly above a `12px` muted label (`#64748b`) and an optional inline pill trend indicator.