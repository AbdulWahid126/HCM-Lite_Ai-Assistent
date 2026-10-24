"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Filter,
  Users,
  Search,
  MessageSquare,
  Check,
  X,
  Palmtree,
  Stethoscope,
  Briefcase,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface LeaveRequestItem {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewComment?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  leaveType: {
    id: string;
    name: string;
    code: string;
  };
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { id: string; name: string } | null;
    designation?: { id: string; title: string } | null;
  };
}

export default function HRLeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");

  // Review Modal State
  const [activeRequest, setActiveRequest] = useState<LeaveRequestItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/leave/requests?status=${statusFilter}` : `/api/leave/requests`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRequests(data || []);
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    setIsSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch(`/api/leave/requests/${activeRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: reviewAction,
          comment: reviewComment || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || `Failed to ${reviewAction.toLowerCase()} request`);
        return;
      }

      setActiveRequest(null);
      setReviewComment("");
      fetchRequests();
    } catch {
      setReviewError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const fullName = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
    return (
      fullName.includes(s) ||
      r.employee.employeeCode.toLowerCase().includes(s) ||
      r.leaveType.name.toLowerCase().includes(s)
    );
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>HR Operations</span>
            <span>/</span>
            <span className="text-slate-700">Leave Approvals</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Leave Approvals & Workforce Coverage
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-0.5 text-xs font-bold text-amber-800">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              {pendingCount} Pending Decisions
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Review time-off requests, monitor organizational coverage, and process formal approvals.
          </p>
        </div>
      </div>

      {/* Operational KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Decisions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingCount}</span>
            <span className="text-xs font-semibold text-amber-600">Requires Action</span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400">
            Awaiting supervisor / HR endorsement
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Leave Policy</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-700">Audit Grounded</span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400">
            Automated balance adjustments on approval
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Working Days Engine</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarDays className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">Smart Deduct</span>
          </div>
          <span className="mt-1 block text-[11px] text-slate-400">
            Excludes weekends & statutory holidays
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "PENDING", label: "Pending Approvals" },
            { id: "APPROVED", label: "Approved" },
            { id: "REJECTED", label: "Rejected" },
            { id: "", label: "All Requests" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee or type..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Requests Inbox Container */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No requests found</h3>
          <p className="mt-1 text-xs text-slate-400">
            {statusFilter === "PENDING"
              ? "All pending leave requests have been reviewed. You're all caught up!"
              : "No leave records match the selected status filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md md:flex-row md:items-center md:justify-between"
            >
              {/* Left: Employee Info & Dates */}
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-sm font-bold text-white shadow-sm">
                  {req.employee.firstName[0]}
                  {req.employee.lastName[0]}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/hr/employees/${req.employee.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                    >
                      {req.employee.firstName} {req.employee.lastName}
                    </Link>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {req.employee.employeeCode}
                    </span>
                    <span className="rounded bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                      {req.employee.department?.name || "General"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {req.leaveType.name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">
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
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {req.workingDays} working days
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic mt-1 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    "{req.reason}"
                  </p>

                  {req.reviewComment && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <MessageSquare className="h-3 w-3 text-slate-400" />
                      <span>Reviewer Note: {req.reviewComment}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Actions or Final Status */}
              <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                {req.status === "PENDING" ? (
                  <>
                    <button
                      onClick={() => {
                        setActiveRequest(req);
                        setReviewAction("REJECT");
                        setReviewComment("");
                        setReviewError("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 active:scale-95"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveRequest(req);
                        setReviewAction("APPROVE");
                        setReviewComment("");
                        setReviewError("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                  </>
                ) : (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      req.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {req.status === "APPROVED" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {req.status === "REJECTED" && <XCircle className="h-3.5 w-3.5" />}
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decision Review Confirmation Modal */}
      {activeRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {reviewAction === "APPROVE" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    {reviewAction === "APPROVE" ? "Approve Leave Request" : "Reject Leave Request"}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeRequest.employee.firstName} {activeRequest.employee.lastName} •{" "}
                    {activeRequest.workingDays} working days
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRequest(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {reviewError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Leave Category</span>
                  <span className="font-bold text-slate-800">
                    {activeRequest.leaveType.name}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Effective Dates</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeRequest.startDate).toLocaleDateString()} to{" "}
                    {new Date(activeRequest.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Stipulated Reason</span>
                  <span className="font-medium text-slate-800 italic">
                    "{activeRequest.reason}"
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Supervisor Comment (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    reviewAction === "APPROVE"
                      ? "e.g. Approved. Coverage arranged."
                      : "e.g. Rejecting due to critical sprint release coverage."
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveRequest(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    `Confirm ${reviewAction === "APPROVE" ? "Approval" : "Rejection"}`
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
