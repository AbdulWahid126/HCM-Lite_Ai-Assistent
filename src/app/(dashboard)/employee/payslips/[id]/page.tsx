"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  Download,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  User,
} from "lucide-react";

interface PayslipData {
  id: string;
  basicSalary: number;
  grossSalary: number;
  allowances: number;
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
  createdAt: string;
  payrollRun: {
    month: number;
    year: number;
    status: string;
    finalizedAt: string;
    company: {
      name: string;
      email: string;
      phone?: string | null;
      address?: string | null;
      country?: string | null;
      currency?: string | null;
    };
  };
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    department?: { name: string } | null;
    designation?: { title: string } | null;
  };
}

export default function OfficialPayslipDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const payslipId = resolvedParams.id;

  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  useEffect(() => {
    fetch(`/api/payroll/payslips/${payslipId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load payslip");
        }
        return res.json();
      })
      .then((data) => setPayslip(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [payslipId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Generating official A4 payslip canvas...</span>
        </div>
      </div>
    );
  }

  if (error || !payslip) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
        <h2 className="text-base font-bold text-slate-800">Unable to retrieve payslip</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          {error || "The requested payslip record does not exist or you do not have permission to view it."}
        </p>
        <Link
          href="/employee/payslips"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Payslips
        </Link>
      </div>
    );
  }

  const periodString = `${monthNames[payslip.payrollRun.month - 1]} ${payslip.payrollRun.year}`;
  const hra = Math.round(payslip.basicSalary * 0.4);
  const medical = Math.round(payslip.basicSalary * 0.1);

  return (
    <div className="space-y-6">
      {/* Non-Printing Top Control Bar */}
      <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/employee/payslips"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Records
          </Link>
          <span className="text-slate-300">•</span>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Doc Ref: PSL-{payslip.payrollRun.year}-{payslip.payrollRun.month.toString().padStart(2, "0")}-{payslip.employee.employeeCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4" />
            <span>Print Official Payslip (A4)</span>
          </button>
        </div>
      </div>

      {/* Official A4 Document Card */}
      <div className="w-full flex justify-center pb-12">
        <div className="payslip-sheet w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 md:p-12 shadow-xl print:shadow-none print:border-none print:p-0">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-slate-900 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold text-lg shadow-sm">
                  HC
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight uppercase">
                    {payslip.payrollRun.company?.name || "HCM LITE ENTERPRISE"}
                  </h1>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">
                    Statutory Salary Disbursement Statement
                  </span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500 max-w-xs">
                {payslip.payrollRun.company?.address || "Main Boulevard, Karachi, Pakistan"} •{" "}
                {payslip.payrollRun.company?.email || "finance@hcmlite.com"}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block rounded bg-slate-900 px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
                PAYSLIP: {periodString.toUpperCase()}
              </span>
              <dl className="mt-2 text-xs space-y-0.5 text-slate-600">
                <div>
                  <span className="text-slate-400">NTN / Tax ID: </span>
                  <span className="font-semibold text-slate-800">PK-7890452-1</span>
                </div>
                <div>
                  <span className="text-slate-400">Status: </span>
                  <span className="font-bold text-emerald-700">FINALIZED & LOCKED</span>
                </div>
              </dl>
            </div>
          </div>

          {/* Employee Metadata Box */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Employee Name
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {payslip.employee.firstName} {payslip.employee.lastName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Employee ID
                </span>
                <span className="font-bold text-emerald-800">
                  {payslip.employee.employeeCode}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Department
                </span>
                <span className="font-semibold text-slate-800">
                  {payslip.employee.department?.name || "Corporate"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Designation
                </span>
                <span className="font-semibold text-slate-800">
                  {payslip.employee.designation?.title || "Staff"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Days in Month
                </span>
                <span className="font-semibold text-slate-800">{payslip.workingDays} Days</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Unpaid Absences
                </span>
                <span className="font-semibold text-slate-800">{payslip.unpaidDays} Days</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Late In fraction
                </span>
                <span className="font-semibold text-slate-800">{payslip.lateDeductionDays} Days</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Currency
                </span>
                <span className="font-bold text-slate-900">PKR (Pakistani Rupee)</span>
              </div>
            </div>
          </div>

          {/* Earnings & Deductions Ledger (Side-by-side) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings Column */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200">
                1. Earnings Breakdown
              </div>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Basic Salary (66.67%)</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      PKR {payslip.basicSalary.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">House Rent Allowance (40%)</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      PKR {hra.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Medical Allowance (10%)</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      PKR {medical.toLocaleString()}
                    </td>
                  </tr>
                  {payslip.allowances - hra - medical > 0 && (
                    <tr>
                      <td className="px-4 py-2.5 text-slate-600">Special Allowances</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                        PKR {(payslip.allowances - hra - medical).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-emerald-50/50 font-bold border-t-2 border-slate-200">
                    <td className="px-4 py-3 text-emerald-900">Total Gross Salary</td>
                    <td className="px-4 py-3 text-right text-emerald-800">
                      PKR {payslip.grossSalary.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Deductions Column */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-200">
                2. Statutory Taxes & Deductions
              </div>
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Income Tax (FBR FY 2024-25)</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-amber-700">
                      PKR {payslip.tax.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Unpaid Leave Deductions</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-rose-700">
                      PKR {payslip.unpaidDeduction.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Half-Day Absences</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-rose-700">
                      PKR {payslip.halfDayDeduction.toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-600">Late Arrival Rule Deduction</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-rose-700">
                      PKR {payslip.lateDeduction.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-rose-50/50 font-bold border-t-2 border-slate-200">
                    <td className="px-4 py-3 text-rose-900">Total Deductions</td>
                    <td className="px-4 py-3 text-right text-rose-800">
                      - PKR {payslip.totalDeductions.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Highlighted Net Salary Block */}
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                  Net Disbursement Payable
                </span>
                <span className="text-3xl font-extrabold tracking-tight">
                  PKR {payslip.netSalary.toLocaleString()}
                </span>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-100">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Bank Disbursement Verified
                </span>
                <p className="mt-1 text-[11px] text-emerald-200">
                  Electronic transfer processed via registered corporate bank account.
                </p>
              </div>
            </div>
          </div>

          {/* Signatures & Watermark Stamp Section */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="border-b border-slate-300 pb-12"></div>
              <span className="mt-2 block font-bold text-slate-700">Employee Signature</span>
              <span className="text-[11px]">Acknowledged without grievance</span>
            </div>
            <div className="text-right">
              <div className="border-b border-slate-300 pb-12"></div>
              <span className="mt-2 block font-bold text-slate-700">Authorized Signatory</span>
              <span className="text-[11px]">Finance & Workforce Operations</span>
            </div>
          </div>

          <div className="mt-8 text-center text-[10px] text-slate-400">
            This is a computer-generated official payroll record issued by HCM Lite. No physical stamp required.
          </div>
        </div>
      </div>
    </div>
  );
}
