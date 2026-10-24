"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  CreditCard,
  Building,
  Calendar,
  Users,
  TrendingDown,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  Printer,
} from "lucide-react";

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: "DRAFT" | "FINALIZED";
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalTax: number;
  totalNet: number;
  finalizedAt?: string | null;
  items?: PayrollItem[];
  _count?: { items: number };
}

interface PayrollItem {
  id: string;
  employeeId: string;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  workingDays: number;
  unpaidDays: number;
  halfDays: number;
  lateDeductionDays: number;
  unpaidDeduction: number;
  halfDayDeduction: number;
  lateDeduction: number;
  totalDeductions: number;
  tax: number;
  netSalary: number;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: { name: string } | null;
    designation?: { title: string } | null;
  };
}

export default function PayrollProcessingPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [currentRun, setCurrentRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRun, setLoadingRun] = useState(false);
  const [search, setSearch] = useState("");

  // Create Draft Modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftMonth, setDraftMonth] = useState(new Date().getMonth() + 1);
  const [draftYear, setDraftYear] = useState(new Date().getFullYear());
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [draftError, setDraftError] = useState("");

  // Finalize Action
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState("");

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/runs");
      if (res.ok) {
        const data = await res.json();
        setRuns(data || []);
        if (data.length > 0 && !selectedRunId) {
          setSelectedRunId(data[0].id);
        }
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const fetchRunDetails = useCallback(async (id: string) => {
    if (!id) return;
    setLoadingRun(true);
    try {
      const res = await fetch(`/api/payroll/runs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentRun(data);
      }
    } catch {
      // quiet fail
    } finally {
      setLoadingRun(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRunId) {
      fetchRunDetails(selectedRunId);
    }
  }, [selectedRunId, fetchRunDetails]);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDraft(true);
    setDraftError("");

    try {
      const res = await fetch("/api/payroll/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: Number(draftMonth), year: Number(draftYear) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDraftError(data.error || "Failed to generate payroll draft");
        return;
      }

      setShowDraftModal(false);
      setSelectedRunId(data.run?.id || data.id);
      fetchRuns();
    } catch {
      setDraftError("Network error. Please try again.");
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleFinalizeAndLock = async () => {
    if (!currentRun) return;
    if (
      !confirm(
        "Finalizing will lock this payroll run and publish official payslips to all employees. Only Administrators can perform this action. Proceed?"
      )
    ) {
      return;
    }

    setIsFinalizing(true);
    setFinalizeError("");

    try {
      const res = await fetch(`/api/payroll/runs/${currentRun.id}`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        setFinalizeError(data.error || "Failed to finalize payroll (Admin permission required)");
        return;
      }

      fetchRunDetails(currentRun.id);
      fetchRuns();
    } catch {
      setFinalizeError("Network error. Please try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const filteredItems = currentRun?.items?.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const fullName = `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase();
    return (
      fullName.includes(s) ||
      item.employee.employeeCode.toLowerCase().includes(s) ||
      (item.employee.department?.name || "").toLowerCase().includes(s)
    );
  }) || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Cycle Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Workforce Suite</span>
            <span>/</span>
            <span className="text-slate-700">Payroll & Statutory Tax</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Monthly Payroll Processing
            </h1>
            {currentRun && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${
                  currentRun.status === "FINALIZED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {currentRun.status === "FINALIZED" ? (
                  <>
                    <Lock className="h-3 w-3" /> FINALIZED & LOCKED
                  </>
                ) : (
                  <>
                    <Unlock className="h-3 w-3" /> DRAFT REVIEW
                  </>
                )}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Automate deductions, statutory FBR 2024-25 tax slabs, and generate audit-grounded payslips.
          </p>
        </div>

        {/* Action Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Cycle selector */}
          <select
            value={selectedRunId}
            onChange={(e) => setSelectedRunId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
          >
            {runs.length === 0 ? (
              <option value="">No cycles generated</option>
            ) : (
              runs.map((r) => (
                <option key={r.id} value={r.id}>
                  {monthNames[r.month - 1]} {r.year} ({r.status})
                </option>
              ))
            )}
          </select>

          {/* New Draft Button */}
          <button
            onClick={() => setShowDraftModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New Draft</span>
          </button>
        </div>
      </div>

      {finalizeError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{finalizeError}</span>
        </div>
      )}

      {/* Main Payroll Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : !currentRun ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No payroll runs found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Generate your first monthly payroll draft to evaluate salaries, attendance deductions, and statutory taxes.
          </p>
          <button
            onClick={() => setShowDraftModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Generate First Draft
          </button>
        </div>
      ) : (
        <>
          {/* Executive Summary Cards Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Disbursement
              </span>
              <div className="mt-2 text-xl font-bold text-slate-900">
                PKR {currentRun.totalGross.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500">
                {currentRun.totalEmployees} Employees
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Deductions
              </span>
              <div className="mt-2 text-xl font-bold text-rose-600">
                - PKR {currentRun.totalDeductions.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Absences & Penalties</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tax Withheld (FBR)
              </span>
              <div className="mt-2 text-xl font-bold text-amber-600">
                PKR {currentRun.totalTax.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Statutory Slabs</span>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Net Disbursement
              </span>
              <div className="mt-2 text-xl font-bold text-emerald-700">
                PKR {currentRun.totalNet.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold">Ready for Bank Transfer</span>
            </div>
          </div>

          {/* Finalization Banner */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  currentRun.status === "FINALIZED"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {currentRun.status === "FINALIZED" ? (
                  <Lock className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Cycle Status: {currentRun.status}
                  </span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    Admin Only Finalization
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {currentRun.status === "FINALIZED"
                    ? `Locked and published on ${new Date(
                        currentRun.finalizedAt || Date.now()
                      ).toLocaleDateString()}. Payslips are immutable.`
                    : "HR can review and recalculate. Only Administrator can finalize and publish payslips."}
                </p>
              </div>
            </div>

            {currentRun.status === "DRAFT" && (
              <button
                disabled={isFinalizing}
                onClick={handleFinalizeAndLock}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Finalizing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Finalize & Lock Payroll
                  </>
                )}
              </button>
            )}
          </div>

          {/* Employee Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Employee Payroll Ledger</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredItems.length} Staff
                </span>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter employee..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs font-medium focus:border-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-4 py-3">Basic (66.7%)</th>
                    <th className="px-4 py-3">Allowances (50%)</th>
                    <th className="px-4 py-3">Gross</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Tax</th>
                    <th className="px-4 py-3">Net Pay</th>
                    <th className="px-5 py-3 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800">
                            {item.employee.firstName[0]}
                            {item.employee.lastName[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {item.employee.firstName} {item.employee.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.employee.employeeCode} • {item.employee.department?.name || "General"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        PKR {item.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        PKR {item.allowances.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        PKR {item.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-rose-600 font-medium">
                        {item.totalDeductions > 0
                          ? `- PKR ${item.totalDeductions.toLocaleString()}`
                          : "--"}
                      </td>
                      <td className="px-4 py-3 text-amber-600 font-medium">
                        {item.tax > 0 ? `PKR ${item.tax.toLocaleString()}` : "0"}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        PKR {item.netSalary.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/employee/payslips/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View A4</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Generate Draft Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h2 className="text-base font-bold text-slate-900">Generate Payroll Draft</h2>
            <p className="mt-1 text-xs text-slate-500">
              Select cycle month and year to process attendance deductions and calculate taxes.
            </p>

            {draftError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{draftError}</span>
              </div>
            )}

            <form onSubmit={handleCreateDraft} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Month
                </label>
                <select
                  value={draftMonth}
                  onChange={(e) => setDraftMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Year
                </label>
                <input
                  type="number"
                  min="2024"
                  max="2030"
                  value={draftYear}
                  onChange={(e) => setDraftYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDraft}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isCreatingDraft ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    "Compute Draft"
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
