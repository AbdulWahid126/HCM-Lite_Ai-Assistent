"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Eye,
  Printer,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
  Building,
  CheckCircle2,
} from "lucide-react";

interface PayslipSummary {
  id: string;
  payrollRunId: string;
  basicSalary: number;
  grossSalary: number;
  totalDeductions: number;
  tax: number;
  netSalary: number;
  createdAt: string;
  payrollRun: {
    month: number;
    year: number;
    status: string;
    finalizedAt: string;
  };
}

export default function EmployeePayslipsListPage() {
  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    fetch("/api/payroll/my-payslips")
      .then((r) => r.json())
      .then((data) => {
        setPayslips(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span>Employee Self-Service</span>
          <span>/</span>
          <span className="text-slate-700">Earnings & Payslips</span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          My Salary Payslips
        </h1>
        <p className="mt-0.5 text-xs text-slate-500">
          View and print official monthly salary disbursements, tax withholdings, and deduction statements.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : payslips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-base font-bold text-slate-800">No finalized payslips available</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            Your monthly salary payslips will appear here as soon as HR/Admin finalizes the payroll cycle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {payslips.map((ps) => {
            const period = `${monthNames[ps.payrollRun.month - 1]} ${ps.payrollRun.year}`;
            return (
              <div
                key={ps.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Disbursement Cycle
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{period}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" /> FINALIZED
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Gross Salary</span>
                    <span className="font-semibold text-slate-800">
                      PKR {ps.grossSalary.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Tax Withheld</span>
                    <span className="font-semibold text-amber-600">
                      PKR {ps.tax.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="text-slate-400">Deductions</span>
                    <span className="font-semibold text-rose-600">
                      PKR {ps.totalDeductions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 text-slate-900 font-bold">
                    <span>Net Disbursed</span>
                    <span className="text-emerald-700 text-sm">
                      PKR {ps.netSalary.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <Link
                    href={`/employee/payslips/${ps.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Official A4 Payslip</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
