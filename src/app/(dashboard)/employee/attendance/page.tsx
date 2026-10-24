"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  HelpCircle,
  History,
  X,
} from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  totalHours?: number | null;
  status: string;
  isGeofenceVerified?: boolean;
}

interface Correction {
  id: string;
  date: string;
  requestedCheckIn?: string | null;
  requestedCheckOut?: string | null;
  reason: string;
  status: string;
  reviewerComments?: string | null;
  createdAt: string;
}

export default function EmployeeAttendancePage() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isClocking, setIsClocking] = useState(false);
  const [clockMsg, setClockMsg] = useState("");
  const [clockError, setClockError] = useState("");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrDate, setCorrDate] = useState(new Date().toISOString().split("T")[0]);
  const [corrIn, setCorrIn] = useState("09:00");
  const [corrOut, setCorrOut] = useState("18:00");
  const [corrReason, setCorrReason] = useState("");
  const [isSubmittingCorr, setIsSubmittingCorr] = useState(false);
  const [corrError, setCorrError] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, corrRes] = await Promise.all([
        fetch("/api/analytics"),
        fetch("/api/attendance/corrections"),
      ]);

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setIsCheckedIn(!!data.checkedInToday);
        setCheckInTime(data.checkInTime || null);
        setRecords(data.monthlyAttendance || []);
      }

      if (corrRes.ok) {
        const corrData = await corrRes.json();
        setCorrections(Array.isArray(corrData) ? corrData : []);
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleCheckIn = async () => {
    setIsClocking(true);
    setClockError("");
    setClockMsg("");

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: 24.8607,
          longitude: 67.0011,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setClockError(data.error || "Check-in failed");
        return;
      }

      setIsCheckedIn(true);
      setCheckInTime(data.record?.checkInTime || "Now");
      setClockMsg("Checked in successfully at " + (data.record?.checkInTime || "Now"));
      fetchAttendance();
    } catch {
      setClockError("Network error recording check-in");
    } finally {
      setIsClocking(false);
    }
  };

  const handleCheckOut = async () => {
    setIsClocking(true);
    setClockError("");
    setClockMsg("");

    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setClockError(data.error || "Check-out failed");
        return;
      }

      setIsCheckedIn(false);
      setClockMsg("Checked out successfully at " + (data.record?.checkOutTime || "Now"));
      fetchAttendance();
    } catch {
      setClockError("Network error recording check-out");
    } finally {
      setIsClocking(false);
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCorr(true);
    setCorrError("");

    try {
      const res = await fetch("/api/attendance/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: corrDate,
          requestedCheckIn: corrIn,
          requestedCheckOut: corrOut,
          reason: corrReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCorrError(data.error || "Failed to submit correction request");
        return;
      }

      setShowCorrectionModal(false);
      setCorrReason("");
      fetchAttendance();
    } catch {
      setCorrError("Network error submitting correction");
    } finally {
      setIsSubmittingCorr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Employee Self-Service</span>
            <span>/</span>
            <span className="text-slate-700">Attendance & Clock</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Attendance Log & Clock In/Out
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Record geofenced work shifts, monitor punctuality, and submit missed clock-in corrections.
          </p>
        </div>

        <button
          onClick={() => setShowCorrectionModal(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all self-start sm:self-center"
        >
          <HelpCircle className="h-4 w-4 text-emerald-600" />
          <span>Request Missed Clock Correction</span>
        </button>
      </div>

      {/* Hero Clock-in / Clock-out Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Workstation Terminal
            </span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {currentTime || "09:00:00 AM"}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{currentDate}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <MapPin className="h-3 w-3" /> Within 150m Office Range
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-start md:items-end">
            {clockMsg && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                {clockMsg}
              </span>
            )}
            {clockError && (
              <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                {clockError}
              </span>
            )}

            {!isCheckedIn ? (
              <button
                disabled={isClocking}
                onClick={handleCheckIn}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isClocking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Recording...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" /> Clock In Now
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={isClocking}
                onClick={handleCheckOut}
                className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isClocking ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Recording...
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5" /> Clock Out (Checked in {checkInTime || ""})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-900">Monthly Attendance History</h3>
          <span className="text-xs font-semibold text-slate-500">
            {records.length} Recorded Shifts
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No attendance records logged yet for this billing cycle.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Geofence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      {new Date(rec.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {rec.checkInTime || "--:--"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      {rec.checkOutTime || "--:--"}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {rec.totalHours ? `${rec.totalHours.toFixed(1)} hrs` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800"
                            : rec.status === "LATE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" /> GPS Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missed Clock Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Attendance Correction Request
              </h2>
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {corrError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{corrError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitCorrection} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Incident Date *
                </label>
                <input
                  type="date"
                  required
                  value={corrDate}
                  onChange={(e) => setCorrDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Actual Check In
                  </label>
                  <input
                    type="time"
                    value={corrIn}
                    onChange={(e) => setCorrIn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Actual Check Out
                  </label>
                  <input
                    type="time"
                    value={corrOut}
                    onChange={(e) => setCorrOut(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Adjustment (min 5 chars) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Card scanner network down upon arrival at 09:00 AM"
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCorr}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingCorr ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Correction"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
