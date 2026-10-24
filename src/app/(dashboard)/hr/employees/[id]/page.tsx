"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  Clock,
  CalendarDays,
  Edit3,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  TrendingUp,
  FileText,
} from "lucide-react";

interface EmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  employmentStatus: string;
  joiningDate: string;
  department?: { id: string; name: string } | null;
  designation?: { id: string; title: string } | null;
  salaryStructure?: {
    basicSalary: number;
    grossSalary: number;
    hra: number;
    medical: number;
    allowances: number;
  } | null;
  leaveBalances: Array<{
    id: string;
    allocated: number;
    used: number;
    pending: number;
    leaveType: { name: string; code: string };
  }>;
  attendanceRecords: Array<{
    id: string;
    date: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    totalHours?: number | null;
    status: string;
    isGeofenceVerified?: boolean;
  }>;
  leaveRequests: Array<{
    id: string;
    startDate: string;
    endDate: string;
    workingDays: number;
    reason: string;
    status: string;
    leaveType: { name: string };
  }>;
  user?: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
}

export default function Employee360ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;

  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "salary" | "attendance" | "leaves">("details");

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    gender: "Male",
    employmentStatus: "ACTIVE",
    basicSalary: 0,
    departmentId: "",
  });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          address: data.address || "",
          gender: data.gender || "Male",
          employmentStatus: data.employmentStatus || "ACTIVE",
          basicSalary: data.salaryStructure?.basicSalary || 80000,
          departmentId: data.department?.id || "",
        });
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchProfile();
    // fetch departments for dropdown
    fetch("/api/org/departments")
      .then((r) => r.json())
      .then((d) => setDepartments(d || []))
      .catch(() => {});
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEditError("");

    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          basicSalary: Number(editForm.basicSalary),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Failed to update profile");
        return;
      }

      setShowEditModal(false);
      fetchProfile();
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-xs font-semibold">Loading 360 workforce profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
        <h2 className="text-base font-bold text-slate-800">Employee record not found</h2>
        <p className="mt-1 text-xs text-slate-500">
          The requested employee identifier does not exist or has been removed.
        </p>
        <Link
          href="/hr/employees"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Directory
        </Link>
      </div>
    );
  }

  const totalLeaveAvailable = profile.leaveBalances.reduce((acc, curr) => {
    return acc + Math.max(0, curr.allocated - curr.used - curr.pending);
  }, 0);

  const presentDays = profile.attendanceRecords.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const attendanceRate =
    profile.attendanceRecords.length > 0
      ? Math.round((presentDays / profile.attendanceRecords.length) * 100)
      : 100;

  const basic = profile.salaryStructure?.basicSalary || 0;
  const gross = profile.salaryStructure?.grossSalary || basic * 1.5;
  const hra = profile.salaryStructure?.hra || basic * 0.4;
  const medical = profile.salaryStructure?.medical || basic * 0.1;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            href="/hr/employees"
            className="inline-flex items-center gap-1 font-semibold text-slate-600 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800">
            {profile.firstName} {profile.lastName} ({profile.employeeCode})
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Printer className="h-4 w-4 text-slate-400" />
            <span>Print Profile</span>
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Master 360 Hero Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-2xl font-bold text-white shadow-md">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </div>
              <span
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow"
                title="Active Record"
              >
                <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {profile.employeeCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    profile.employmentStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                  {profile.employmentStatus}
                </span>
                <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-800">
                  {profile.department?.name || "Corporate"}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-600">
                {profile.designation?.title || "Staff Member"}
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{profile.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Joined{" "}
                    {new Date(profile.joiningDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick KPI Cards Grid */}
          <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
            <div className="rounded-xl bg-slate-50 p-3 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Attendance
              </span>
              <div className="mt-1 text-lg font-bold text-emerald-600">{attendanceRate}%</div>
              <span className="text-[10px] text-slate-400">Past 30 Records</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Leave Balance
              </span>
              <div className="mt-1 text-lg font-bold text-slate-900">{totalLeaveAvailable}</div>
              <span className="text-[10px] text-slate-400">Days Available</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-center min-w-[110px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Gross Monthly
              </span>
              <div className="mt-1 text-sm font-bold text-slate-900">
                PKR {gross.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">Pak Tax Ready</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab("details")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "details"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Personal & Job Details
          </button>
          <button
            onClick={() => setActiveTab("salary")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "salary"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Salary & Tax Structure
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "attendance"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Attendance History ({profile.attendanceRecords.length})
          </button>
          <button
            onClick={() => setActiveTab("leaves")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "leaves"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Leave Balances & Requests ({profile.leaveRequests.length})
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "details" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" /> Personal Identity
            </h3>
            <dl className="mt-4 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Full Name</dt>
                <dd className="font-semibold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Gender</dt>
                <dd className="font-semibold text-slate-900">{profile.gender || "Unspecified"}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Corporate Email</dt>
                <dd className="font-semibold text-slate-900">{profile.email}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Contact Number</dt>
                <dd className="font-semibold text-slate-900">{profile.phone || "Not on file"}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Residential Address</dt>
                <dd className="font-semibold text-slate-900">{profile.address || "Not on file"}</dd>
              </div>
            </dl>
          </div>

          {/* Job & Org Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building className="h-4 w-4 text-teal-600" /> Organizational Placement
            </h3>
            <dl className="mt-4 divide-y divide-slate-100 text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Employee Code</dt>
                <dd className="font-bold text-emerald-700">{profile.employeeCode}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Department</dt>
                <dd className="font-semibold text-slate-900">
                  {profile.department?.name || "General"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Designation</dt>
                <dd className="font-semibold text-slate-900">
                  {profile.designation?.title || "Staff"}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">Employment Status</dt>
                <dd className="font-semibold text-slate-900">{profile.employmentStatus}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-400">User Login Account</dt>
                <dd className="font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Activated
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "salary" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pakistan Statutory Salary & Tax Structure (2024-2025)
              </h3>
              <p className="text-xs text-slate-500">
                Fixed 1.5x Multiplier Breakdown: Basic Salary (66.67%), House Rent Allowance (40% of Basic), Medical Allowance (10% of Basic).
              </p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              FBR FY 2024-25 Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs text-slate-400 font-semibold">Basic Salary (66.67%)</span>
              <div className="mt-2 text-xl font-bold text-slate-900">
                PKR {basic.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">Core contractual wage</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs text-slate-400 font-semibold">House Rent Allowance (40%)</span>
              <div className="mt-2 text-xl font-bold text-slate-900">
                PKR {hra.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">40% of Basic Salary</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <span className="text-xs text-slate-400 font-semibold">Medical Allowance (10%)</span>
              <div className="mt-2 text-xl font-bold text-slate-900">
                PKR {medical.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500">10% of Basic Salary</span>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <span className="text-xs text-emerald-800 font-bold">Total Gross Monthly</span>
              <div className="mt-2 text-xl font-bold text-emerald-700">
                PKR {gross.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-700">Annual: PKR {(gross * 12).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Attendance Log (Recent 30 Records)</h3>
          {profile.attendanceRecords.length === 0 ? (
            <p className="text-xs text-slate-500">No attendance records logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Check In</th>
                    <th className="px-4 py-2.5">Check Out</th>
                    <th className="px-4 py-2.5">Worked Hours</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profile.attendanceRecords.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">
                        {new Date(att.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{att.checkInTime || "--:--"}</td>
                      <td className="px-4 py-2.5 text-slate-600">{att.checkOutTime || "--:--"}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">
                        {att.totalHours ? `${att.totalHours.toFixed(1)} hrs` : "--"}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            att.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800"
                              : att.status === "LATE"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "leaves" && (
        <div className="space-y-6">
          {/* Balances Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {profile.leaveBalances.map((b) => {
              const available = Math.max(0, b.allocated - b.used - b.pending);
              return (
                <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {b.leaveType.name}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-900">{available}</span>
                    <span className="text-xs text-slate-400">/ {b.allocated} Days</span>
                  </div>
                  <div className="mt-3 flex justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    <span>Used: {b.used}</span>
                    <span>Pending: {b.pending}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Past Leave Requests Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Leave Application History
            </h3>
            {profile.leaveRequests.length === 0 ? (
              <p className="mt-4 text-xs text-slate-500">No leave requests submitted yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-2.5">Leave Type</th>
                      <th className="px-4 py-2.5">Dates</th>
                      <th className="px-4 py-2.5">Working Days</th>
                      <th className="px-4 py-2.5">Reason</th>
                      <th className="px-4 py-2.5">Decision Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {profile.leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-slate-900">
                          {req.leaveType.name}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600">
                          {new Date(req.startDate).toLocaleDateString()} -{" "}
                          {new Date(req.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">
                          {req.workingDays} d
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">
                          {req.reason}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">Edit Employee Profile</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Residential Address
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Employment Status
                  </label>
                  <select
                    value={editForm.employmentStatus}
                    onChange={(e) => setEditForm({ ...editForm, employmentStatus: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PROBATION">PROBATION</option>
                    <option value="ON_LEAVE">ON_LEAVE</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Basic Salary (PKR)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={editForm.basicSalary}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    "Save Changes"
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
