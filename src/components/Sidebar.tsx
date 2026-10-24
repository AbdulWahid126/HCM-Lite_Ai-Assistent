"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Megaphone,
  UserCheck,
  FileText,
  Clock,
  Sparkles,
  X,
  Briefcase,
} from "lucide-react";

export interface SidebarProps {
  role: "ADMIN" | "HR" | "EMPLOYEE";
  isOpen?: boolean; // legacy compatibility
  isMobileOpen?: boolean;
  isCollapsed?: boolean;
  onClose?: () => void; // legacy compatibility
  onCloseMobile?: () => void;
}

export default function Sidebar({
  role,
  isOpen,
  isMobileOpen,
  isCollapsed = false,
  onClose,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const mobileOpen = isMobileOpen ?? isOpen ?? false;
  const handleClose = onCloseMobile ?? onClose;

  const adminLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Company Settings", href: "/admin/settings", icon: Settings },
    { label: "User Access", href: "/admin/users", icon: UserCheck },
    { label: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
    { label: "Payroll Finalization", href: "/hr/payroll", icon: FileSpreadsheet },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
  ];

  const hrLinks = [
    { label: "HR Dashboard", href: "/hr", icon: LayoutDashboard },
    { label: "Employee Directory", href: "/hr/employees", icon: Users },
    { label: "Attendance Board", href: "/hr/attendance", icon: CalendarCheck },
    { label: "Leave Requests", href: "/hr/leaves", icon: CalendarDays },
    { label: "Payroll Processing", href: "/hr/payroll", icon: FileSpreadsheet },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
  ];

  const employeeLinks = [
    { label: "My Dashboard", href: "/employee", icon: LayoutDashboard },
    { label: "Attendance & Clock", href: "/employee/attendance", icon: Clock },
    { label: "Leave & Balances", href: "/employee/leaves", icon: CalendarDays },
    { label: "My Payslips", href: "/employee/payslips", icon: FileText },
    { label: "Announcements", href: "/announcements", icon: Megaphone },
  ];

  const links =
    role === "ADMIN"
      ? adminLinks
      : role === "HR"
      ? hrLinks
      : employeeLinks;

  return (
    <>
      {/* 1. Mobile Drawer (screens < lg) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between py-5 px-3 shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        <div className="space-y-6">
          {/* Top Brand & Close Button */}
          <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100">
            <Link
              href="/"
              onClick={handleClose}
              className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/20">
                <Briefcase className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold leading-none text-slate-900">
                  HCM <span className="text-emerald-600">Lite</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-slate-400">
                  {role} WORKFORCE
                </span>
              </div>
            </Link>
            {handleClose && (
              <button
                onClick={handleClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="px-3">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              {role} NAVIGATION
            </span>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Feature Card */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>AI Copilot Active</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700/80 leading-relaxed">
            Role-scoped intelligence & natural-language workflows ready.
          </p>
        </div>
      </aside>

      {/* 2. Desktop Rail / Expanded Sidebar (screens >= lg) */}
      <aside
        className={`hidden lg:flex sticky top-0 h-screen shrink-0 z-20 flex-col justify-between bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${
          isCollapsed ? "w-20 px-2 py-4" : "w-64 px-3 py-5"
        }`}
        aria-label="Desktop navigation"
      >
        <div className="space-y-6">
          {/* Top Brand area in Sidebar */}
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "px-2"}`}>
            <Link
              href="/"
              className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900 overflow-hidden"
              title="HCM Lite"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/20">
                <Briefcase className="h-5 w-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col whitespace-nowrap transition-opacity duration-200">
                  <span className="text-base font-extrabold leading-none text-slate-900">
                    HCM <span className="text-emerald-600">Lite</span>
                  </span>
                  <span className="text-[10px] font-medium tracking-wide text-slate-400">
                    ENTERPRISE
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Section title */}
          <div className={`px-2 ${isCollapsed ? "text-center" : ""}`}>
            {isCollapsed ? (
              <div className="h-1 w-6 mx-auto rounded-full bg-slate-200" />
            ) : (
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase whitespace-nowrap">
                {role} NAVIGATION
              </span>
            )}
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <div key={link.href} className="relative group">
                  <Link
                    href={link.href}
                    aria-label={link.label}
                    title={isCollapsed ? link.label : undefined}
                    className={`flex items-center rounded-xl transition-all ${
                      isCollapsed
                        ? "justify-center p-3 w-12 h-12 mx-auto"
                        : "gap-3 px-3 py-2.5 text-xs font-semibold"
                    } ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-bold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate whitespace-nowrap">{link.label}</span>
                    )}
                  </Link>

                  {/* Floating tooltip for collapsed rail */}
                  {isCollapsed && (
                    <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 hidden rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg whitespace-nowrap group-hover:block transition-all">
                      {link.label}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Feature Card / Badge */}
        <div className="mt-auto pt-4">
          {isCollapsed ? (
            <div
              className="flex h-11 w-11 mx-auto items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer shadow-xs hover:bg-emerald-100 transition"
              title="AI Copilot Active"
            >
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-3.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="truncate">AI Copilot Active</span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-700/80 leading-relaxed">
                Role-scoped intelligence & natural-language workflows ready.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
