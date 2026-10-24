"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  Sparkles,
  RefreshCcw,
  Settings,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Analytics {
  headcount: number;
  attritionRate: number;
  monthlyPayrollCost: number;
  averageSalary: number;
  departmentBreakdown: { name: string; count: number; payroll: number }[];
  genderBreakdown: { label: string; count: number }[];
  attendanceSummary: { present: number; late: number; absent: number };
  recentAudit: {
    id: string;
    action: string;
    entityType: string;
    performedByEmail: string;
    createdAt: string;
  }[];
}

const DEPT_COLORS = ["#059669", "#0d9488", "#0891b2", "#7c3aed", "#db2777"];

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const generateAISummary = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/summary", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.bullets || [data.summary]);
      } else {
        const err = await res.json();
        setAiError(err.error || "AI summary failed.");
      }
    } catch {
      setAiError("Network error. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const KPICard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendLabel,
    color,
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: "up" | "down";
    trendLabel?: string;
    color: string;
  }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 font-outfit">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {trendLabel && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium">
          {trend === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span className={trend === "up" ? "text-emerald-600" : "text-rose-600"}>{trendLabel}</span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Executive Overview</span>
            <span className="ml-2 flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live • Synced now
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">Executive Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateAISummary}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate AI Summary
          </button>
          <Link
            href="/admin/settings"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            Org Settings
          </Link>
        </div>
      </div>

      {/* AI Intelligence Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 p-5 shadow-sm">
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-emerald-100/60 blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-slate-900">AI Workforce Intelligence</span>
            <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              REALTIME
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              AI-generated • Verified server data
            </span>
            <button
              onClick={generateAISummary}
              disabled={aiLoading}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50 transition"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </div>
        </div>
        <div className="mt-3.5">
          {aiError && (
            <div className="flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="h-4 w-4" />
              {aiError}
            </div>
          )}
          {aiLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              Generating AI executive summary from live database...
            </div>
          )}
          {aiSummary && !aiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiSummary.map((bullet, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/80 p-3"
                >
                  <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-snug">{bullet}</p>
                </div>
              ))}
            </div>
          ) : !aiLoading && !aiError ? (
            <p className="text-xs text-slate-500">
              Click <strong>Generate AI Summary</strong> to generate a real-time executive briefing from live HR data.
            </p>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Headcount"
          value={analytics?.headcount?.toString() ?? "—"}
          icon={Users}
          trend="up"
          trendLabel="Active employees"
          color="bg-emerald-600"
        />
        <KPICard
          title="YTD Attrition"
          value={`${analytics?.attritionRate?.toFixed(1) ?? "—"}%`}
          icon={TrendingUp}
          trend="down"
          trendLabel="vs last quarter"
          color="bg-rose-500"
        />
        <KPICard
          title="Monthly Payroll"
          value={analytics?.monthlyPayrollCost ? formatPKR(analytics.monthlyPayrollCost) : "—"}
          icon={DollarSign}
          color="bg-teal-600"
        />
        <KPICard
          title="Avg. Salary"
          value={analytics?.averageSalary ? formatPKR(analytics.averageSalary) : "—"}
          icon={BarChart3}
          color="bg-violet-600"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Headcount Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Department Headcount</h2>
          {analytics?.departmentBreakdown && analytics.departmentBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.departmentBreakdown} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {analytics.departmentBreakdown.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-48 items-center justify-center text-xs text-slate-400">
              No department data available yet
            </div>
          )}
        </div>

        {/* Today's Attendance Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Today's Attendance</h2>
          <div className="space-y-3">
            {[
              { label: "Present", value: analytics?.attendanceSummary?.present ?? 0, color: "bg-emerald-500", text: "text-emerald-700" },
              { label: "Late (> 09:15)", value: analytics?.attendanceSummary?.late ?? 0, color: "bg-amber-500", text: "text-amber-700" },
              { label: "Absent / No Check-In", value: analytics?.attendanceSummary?.absent ?? 0, color: "bg-rose-500", text: "text-rose-700" },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{item.label}</span>
                  <span className={`font-bold ${item.text}`}>{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all`}
                    style={{ width: `${analytics?.headcount ? Math.min((item.value / analytics.headcount) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quick admin links */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
            {[
              { label: "Org Settings", href: "/admin/settings", icon: Settings },
              { label: "User Access", href: "/admin/users", icon: UserCheck },
              { label: "Audit Logs", href: "/admin/audit", icon: ShieldCheck },
            ].map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Audit Activity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900">Recent Audit Activity</h2>
          <Link href="/admin/audit" className="text-xs font-semibold text-emerald-600 hover:underline">
            View all →
          </Link>
        </div>
        {analytics?.recentAudit && analytics.recentAudit.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="pb-2 font-semibold text-slate-500 uppercase tracking-wider pr-4">Action</th>
                  <th className="pb-2 font-semibold text-slate-500 uppercase tracking-wider pr-4">Entity</th>
                  <th className="pb-2 font-semibold text-slate-500 uppercase tracking-wider pr-4">By</th>
                  <th className="pb-2 font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analytics.recentAudit.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 pr-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-600">{log.entityType}</td>
                    <td className="py-2.5 pr-4 text-slate-600 truncate max-w-[160px]">{log.performedByEmail}</td>
                    <td className="py-2.5 text-slate-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">No audit events recorded yet</p>
        )}
      </div>
    </div>
  );
}
