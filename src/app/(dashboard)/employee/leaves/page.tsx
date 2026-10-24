"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  FileText,
  Palmtree,
  Stethoscope,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import SmartLeaveModal from "@/components/SmartLeaveModal";

interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  name: string;
  code: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
}

interface LeaveRequest {
  id: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewComment?: string | null;
  createdAt: string;
  leaveType: {
    name: string;
    code: string;
  };
}

export default function EmployeeLeavesPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Smart AI Modal
  const [showSmartModal, setShowSmartModal] = useState(false);

  // Cancel action
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchLeaveData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, reqRes] = await Promise.all([
        fetch("/api/leave/balances"),
        fetch("/api/leave/requests"),
      ]);

      if (balRes.ok) {
        const balData = await balRes.json();
        setBalances(balData || []);
        if (balData.length > 0 && !formData.leaveTypeId) {
          setFormData((prev) => ({ ...prev, leaveTypeId: balData[0].leaveTypeId }));
        }
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData || []);
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [formData.leaveTypeId]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to submit leave application");
        return;
      }

      setShowApplyModal(false);
      setFormData({
        leaveTypeId: balances[0]?.leaveTypeId || "",
        startDate: "",
        endDate: "",
        reason: "",
      });
      fetchLeaveData();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmartModalConfirm = async (extracted: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leave/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extracted),
      });
      if (res.ok) {
        setShowSmartModal(false);
        fetchLeaveData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to submit extracted leave");
      }
    } catch {
      alert("Network error submitting leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this pending leave request?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/leave/requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchLeaveData();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to cancel request");
      }
    } catch {
      alert("Network error");
    } finally {
      setCancellingId(null);
    }
  };

  const getLeaveIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("annual") || lower.includes("vacation")) return Palmtree;
    if (lower.includes("sick") || lower.includes("medical")) return Stethoscope;
    if (lower.includes("casual")) return Briefcase;
    return CalendarDays;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Context Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Workforce Suite</span>
            <span>/</span>
            <span className="text-slate-700">Time Off</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Leave Management & Time Off
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage your annual quotas, apply for scheduled time away, and review approval statuses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Smart AI Assistant Trigger */}
          <button
            onClick={() => setShowSmartModal(true)}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-100 text-teal-700">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="text-left">
              <span className="block font-bold text-slate-800 leading-tight">Smart AI Filing</span>
              <span className="text-[10px] text-slate-400">"Need next Mon off..."</span>
            </div>
          </button>

          {/* Standard Apply Modal Trigger */}
          <button
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* AI Quick Prompt Banner */}
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-r from-teal-50/80 via-emerald-50/40 to-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Smart Natural-Language Leave Assistant
                </span>
                <span className="rounded-full bg-teal-200/70 px-2 py-0.5 text-[10px] font-bold text-teal-900">
                  AI Grounded
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Type natural phrases like{" "}
                <span className="font-semibold text-teal-900">
                  "I need next Monday and Tuesday off for family travel"
                </span>{" "}
                and let AI calculate business dates automatically.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSmartModal(true)}
            className="self-start sm:self-center shrink-0 rounded-xl bg-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition-all"
          >
            Try AI Leave Drafter
          </button>
        </div>
      </div>

      {/* Leave Quota Balance Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex h-36 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : balances.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            No leave quotas allocated for the current fiscal period.
          </div>
        ) : (
          balances.map((b) => {
            const Icon = getLeaveIcon(b.name);
            const percentage = b.allocated > 0 ? Math.round((b.available / b.allocated) * 100) : 0;
            return (
              <div
                key={b.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Quota Balance
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900">{b.available}</span>
                  <span className="text-xs text-slate-400">/ {b.allocated} Days Available</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full rounded-full bg-slate-100 h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  ></div>
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span>Used: <strong>{b.used} d</strong></span>
                  <span>Pending: <strong className="text-amber-600">{b.pending} d</strong></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Leave Application History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Application History & Status</h3>
            <p className="text-xs text-slate-500">
              Track the progress of your submitted leave requests and review decisions.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {requests.length} Submissions
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No leave requests yet</h4>
            <p className="mt-1 text-xs text-slate-400">
              You haven't submitted any leave applications for this fiscal year.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-6 py-3.5">Leave Type</th>
                  <th className="px-4 py-3.5">Date Range</th>
                  <th className="px-4 py-3.5">Working Days</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-4 py-3.5">Applied On</th>
                  <th className="px-4 py-3.5">Decision Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-900">{req.leaveType.name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {new Date(req.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(req.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-900">{req.workingDays}</span>
                      <span className="text-[11px] text-slate-400"> working d</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          req.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : req.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                        {req.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                        {req.status === "PENDING" && <Clock className="h-3 w-3" />}
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {req.status === "PENDING" ? (
                        <button
                          disabled={cancellingId === req.id}
                          onClick={() => handleCancelRequest(req.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          {cancellingId === req.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          <span>Cancel</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standard Leave Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Apply for Leave</h2>
                  <p className="text-xs text-slate-500">
                    Weekends and public holidays are automatically deducted.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Leave Category *
                </label>
                <select
                  required
                  value={formData.leaveTypeId}
                  onChange={(e) => setFormData({ ...formData, leaveTypeId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {balances.map((b) => (
                    <option key={b.leaveTypeId} value={b.leaveTypeId}>
                      {b.name} ({b.available} Days Available)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Absence *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide brief context for HR approval..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Natural Language Leave Extraction Modal */}
      <SmartLeaveModal
        isOpen={showSmartModal}
        onClose={() => setShowSmartModal(false)}
        leaveTypes={balances.map((b) => ({ id: b.leaveTypeId, name: b.name }))}
        onConfirm={handleSmartModalConfirm}
      />
    </div>
  );
}
