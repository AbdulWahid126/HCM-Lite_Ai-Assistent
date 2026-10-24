"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  CalendarDays,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  Megaphone,
  Sparkles,
} from "lucide-react";

interface EmployeeAnalytics {
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation?: string;
    department?: string;
  };
  todayRecord: {
    checkIn: string | null;
    checkOut: string | null;
    workedMinutes: number | null;
    isLate: boolean;
    geofenceValid: boolean | null;
  } | null;
  weeklyHours: number;
  leaveBalances: { typeName: string; allocated: number; used: number; pending: number }[];
  latestPayslip: { id: string; month: number; year: number; netPay: number } | null;
  announcements: { id: string; title: string; priority: string; createdAt: string }[];
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<EmployeeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [clock, setClock] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics");
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    setActionMsg(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // GPS optional — continue without location
      }

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const result = await res.json();
      if (res.ok) {
        setActionMsg({ type: "success", text: `✓ Checked in at ${new Date(result.record?.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
        fetchData();
      } else {
        setActionMsg({ type: "error", text: result.error || "Check-in failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/attendance/check-out", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setActionMsg({ type: "success", text: `✓ Checked out. Total: ${Math.floor((result.record?.workedMinutes ?? 0) / 60)}h ${(result.record?.workedMinutes ?? 0) % 60}m` });
        fetchData();
      } else {
        setActionMsg({ type: "error", text: result.error || "Check-out failed." });
      }
    } catch {
      setActionMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCheckOutLoading(false);
    }
  };

  const isCheckedIn = !!data?.todayRecord?.checkIn;
  const isCheckedOut = !!data?.todayRecord?.checkOut;

  const greetingHour = clock.getHours();
  const greeting = greetingHour < 12 ? "Good morning" : greetingHour < 17 ? "Good afternoon" : "Good evening";

  const formatPKR = (n: number) =>
    new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(n);

  const priorityColor = (p: string) => {
    if (p === "URGENT") return "bg-rose-100 text-rose-700";
    if (p === "HIGH") return "bg-amber-100 text-amber-700";
    if (p === "NORMAL") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Welcome Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 text-xl">
            👋
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-outfit">
              {greeting}, {data?.employee?.firstName ?? "there"}!
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
              {data?.employee?.employeeCode && <span className="font-semibold text-emerald-600">{data.employee.employeeCode}</span>}
              {data?.employee?.designation && <><span>•</span><span>{data.employee.designation}</span></>}
              {data?.employee?.department && <><span>•</span><span>{data.employee.department}</span></>}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                <Clock className="h-3 w-3 text-emerald-600" />
                Shift: 09:00 AM – 06:00 PM (15m grace)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {data?.latestPayslip && (
            <Link
              href={`/employee/payslips/${data.latestPayslip.id}`}
              className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              {new Date(0, data.latestPayslip.month - 1).toLocaleString("en", { month: "long" })} Payslip
            </Link>
          )}
          <Link
            href="/employee/leaves"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
          >
            <CalendarDays className="h-4 w-4" />
            Apply for Leave
          </Link>
        </div>
      </div>

      {/* Hero Check-In / Check-Out Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">
        <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-emerald-50 blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {isCheckedIn && !isCheckedOut ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                PRESENT • ON-TIME CHECK-IN
              </span>
            ) : isCheckedOut ? (
              <span className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600">
                <CheckCircle2 className="h-3 w-3" />
                CHECKED OUT
              </span>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                NOT CHECKED IN
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            GPS • 150m geofence active
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          {/* Live Clock */}
          <div>
            <div className="font-outfit text-5xl font-bold tracking-tight text-slate-900">
              {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {clock.toLocaleDateString("en-PK", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            {data?.todayRecord?.checkIn && (
              <div className="mt-3 flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Check-In</span>
                  <span className="ml-2 font-mono font-semibold text-emerald-700">
                    {new Date(data.todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {data.todayRecord.checkOut && (
                  <div>
                    <span className="text-slate-400">Check-Out</span>
                    <span className="ml-2 font-mono font-semibold text-slate-700">
                      {new Date(data.todayRecord.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {data.todayRecord.workedMinutes && (
                  <div>
                    <span className="text-slate-400">Worked</span>
                    <span className="ml-2 font-semibold text-slate-800">
                      {Math.floor(data.todayRecord.workedMinutes / 60)}h {data.todayRecord.workedMinutes % 60}m
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            {actionMsg && (
              <div className={`rounded-xl p-3 text-xs font-medium ${
                actionMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {actionMsg.text}
              </div>
            )}
            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-60 transition-all"
              >
                {checkInLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                {checkInLoading ? "Marking attendance..." : "Check In Now"}
              </button>
            ) : !isCheckedOut ? (
              <button
                onClick={handleCheckOut}
                disabled={checkOutLoading}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-700 py-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 transition-all"
              >
                {checkOutLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                {checkOutLoading ? "Checking out..." : "Check Out"}
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-4 text-sm font-semibold text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Day Complete
              </div>
            )}
            <p className="text-center text-[10px] text-slate-400">
              Office 09:00 AM • Grace until 09:15 AM • Geofence 150m
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Weekly Hours</h2>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 font-outfit">{data?.weeklyHours?.toFixed(1) ?? "0.0"}h</div>
          <div className="text-xs text-slate-500 mt-1">of 40.0h standard week</div>
          <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(((data?.weeklyHours ?? 0) / 40) * 100, 100)}%` }}
            />
          </div>
          <Link href="/employee/attendance" className="mt-3 block text-xs font-semibold text-emerald-600 hover:underline">
            View attendance history →
          </Link>
        </div>

        {/* Leave Balances */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Leave Balances</h2>
            <Link href="/employee/leaves" className="text-xs font-semibold text-emerald-600 hover:underline">
              Manage →
            </Link>
          </div>
          {data?.leaveBalances && data.leaveBalances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {data.leaveBalances.map((lb) => {
                const available = lb.allocated - lb.used - lb.pending;
                const pct = Math.max(0, Math.min((available / lb.allocated) * 100, 100));
                return (
                  <div key={lb.typeName} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{lb.typeName}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-slate-900 font-outfit">{available}</span>
                      <span className="text-xs text-slate-400">/ {lb.allocated} days</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    {lb.pending > 0 && <div className="mt-1 text-[10px] text-amber-600">{lb.pending} pending</div>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No leave balance data available.</p>
          )}
        </div>
      </div>

      {/* Announcements */}
      {data?.announcements && data.announcements.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-slate-900">Latest Announcements</h2>
            </div>
            <Link href="/announcements" className="text-xs font-semibold text-emerald-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {data.announcements.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${priorityColor(a.priority)}`}>
                  {a.priority}
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
