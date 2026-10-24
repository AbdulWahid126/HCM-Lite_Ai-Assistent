"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  CalendarOff,
  Clock,
  Loader2,
  Filter,
  CheckCircle2,
  XCircle,
  MapPin,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BoardEntry {
  id: string;
  employee: {
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { name: string } | null;
  };
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number | null;
  status: string;
  isLate: boolean;
  geofenceValid: boolean | null;
}

interface AttendanceSummary {
  present: number;
  late: number;
  onLeave: number;
  absent: number;
  headcount: number;
}

interface Analytics {
  headcount: number;
  attendanceSummary: AttendanceSummary;
  weeklyTrend: { date: string; present: number; late: number }[];
  pendingLeaveRequests: number;
}

export default function HRDashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const today = new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, boardRes, deptRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch(`/api/attendance/board?date=${date}${selectedDept ? `&departmentId=${selectedDept}` : ""}`),
        fetch("/api/org/departments"),
      ]);

      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (boardRes.ok) {
        const b = await boardRes.json();
        setBoard(b.records || []);
      }
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [date, selectedDept]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = (mins: number | null) => {
    if (!mins) return "—";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const fmtTime = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";

  const statusBadge = (entry: BoardEntry) => {
    if (entry.status === "ABSENT")
      return <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Absent</span>;
    if (entry.isLate)
      return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Late</span>;
    if (entry.checkIn)
      return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Present</span>;
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">—</span>;
  };

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Operations</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">HR Operations Hub</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Working Day (09:00 – 18:00 PKT)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">HR Operations Hub</h1>
          <p className="mt-0.5 text-xs text-slate-500">{today} • Live Terminal Sync</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-8 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">All Departments ({analytics?.headcount ?? 0})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none"
          />
          <Link
            href="/hr/employees"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <Users className="h-3.5 w-3.5" />
            Directory
          </Link>
          <Link
            href="/hr/leaves"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Leave Inbox
          </Link>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Headcount", value: analytics?.headcount ?? "—", icon: Users, color: "bg-slate-700" },
          { label: "Present Today", value: analytics?.attendanceSummary?.present ?? "—", icon: CheckCircle2, color: "bg-emerald-600" },
          { label: "Late Arrivals", value: analytics?.attendanceSummary?.late ?? "—", icon: AlertTriangle, color: "bg-amber-500" },
          { label: "On Leave", value: analytics?.attendanceSummary?.onLeave ?? "—", icon: CalendarOff, color: "bg-blue-500" },
          { label: "Pending Approvals", value: analytics?.pendingLeaveRequests ?? "—", icon: CalendarCheck, color: "bg-rose-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900 font-outfit">{value}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Trend Chart */}
      {analytics?.weeklyTrend && analytics.weeklyTrend.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">7-Day Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={analytics.weeklyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lateGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11 }} />
              <Area type="monotone" dataKey="present" stroke="#059669" fill="url(#presentGrad)" strokeWidth={2} name="Present" />
              <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="url(#lateGrad)" strokeWidth={2} name="Late" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Daily Attendance Board */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Daily Attendance Board</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Employee</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Department</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Check-In</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Check-Out</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Worked</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Geo</th>
                <th className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {board.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {loading ? "Loading attendance data..." : "No attendance records for this date."}
                  </td>
                </tr>
              ) : (
                board.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {entry.employee.firstName.charAt(0)}{entry.employee.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {entry.employee.firstName} {entry.employee.lastName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{entry.employee.employeeCode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{entry.employee.department?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{fmtTime(entry.checkIn)}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{fmtTime(entry.checkOut)}</td>
                    <td className="px-4 py-3 text-slate-600">{fmt(entry.workedMinutes)}</td>
                    <td className="px-4 py-3">
                      {entry.geofenceValid === null ? (
                        <span className="text-slate-400">—</span>
                      ) : entry.geofenceValid ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <MapPin className="h-3 w-3" />
                          <span className="text-[10px] font-semibold">Valid</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-rose-600">
                          <XCircle className="h-3 w-3" />
                          <span className="text-[10px] font-semibold">Invalid</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{statusBadge(entry)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
