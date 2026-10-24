"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  Download,
  Upload,
  Filter,
  Eye,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  UserCheck,
  Building,
} from "lucide-react";

interface Employee {
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
    allowances: number;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

interface Designation {
  id: string;
  title: string;
  departmentId?: string;
}

export default function EmployeeDirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [formData, setFormData] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    gender: "Male",
    departmentId: "",
    designationId: "",
    joiningDate: new Date().toISOString().split("T")[0],
    basicSalary: 80000,
  });

  // Import Modal & Dry Run
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);
  const [importError, setImportError] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search ? { search } : {}),
        ...(selectedDept ? { departmentId: selectedDept } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
      });

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch {
      // quiet fail
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    // Load departments & designations
    const loadMeta = async () => {
      try {
        const [dRes, desRes] = await Promise.all([
          fetch("/api/org/departments"),
          fetch("/api/org/designations"),
        ]);
        if (dRes.ok) {
          const dData = await dRes.json();
          setDepartments(dData || []);
        }
        if (desRes.ok) {
          const desData = await desRes.json();
          setDesignations(desData || []);
        }
      } catch {}
    };
    loadMeta();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAddError("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          basicSalary: Number(formData.basicSalary),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to create employee");
        return;
      }

      setShowAddModal(false);
      setFormData({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        gender: "Male",
        departmentId: "",
        designationId: "",
        joiningDate: new Date().toISOString().split("T")[0],
        basicSalary: 80000,
      });
      fetchEmployees();
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunDryRun = async () => {
    if (!importFile) return;
    setIsDryRunning(true);
    setImportError("");
    setImportReport(null);

    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("dryRun", "true");

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Dry run validation failed");
        if (data.report) setImportReport(data.report);
      } else {
        setImportReport(data.report);
      }
    } catch {
      setImportError("Error processing pre-flight dry run.");
    } finally {
      setIsDryRunning(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importFile) return;
    setIsImporting(true);
    setImportError("");

    try {
      const fd = new FormData();
      fd.append("file", importFile);
      fd.append("dryRun", "false");

      const res = await fetch("/api/employees/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        setImportError(data.error || "Import failed");
        if (data.report) setImportReport(data.report);
      } else {
        setShowImportModal(false);
        setImportFile(null);
        setImportReport(null);
        fetchEmployees();
      }
    } catch {
      setImportError("Error committing bulk employee import.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Command Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Employee Directory
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              {totalCount} Active Staff
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage corporate roster, job designations, salary packages, and bulk CSV onboarding.
          </p>
        </div>

        {/* Action cluster */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Roster Table
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Cards Grid
            </button>
          </div>

          {/* Export CSV */}
          <a
            href="/api/employees/export"
            download="hcm_employees_export.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300"
          >
            <Download className="h-4 w-4 text-slate-400" />
            <span>Export CSV</span>
          </a>

          {/* Import CSV Trigger */}
          <button
            onClick={() => {
              setShowImportModal(true);
              setImportReport(null);
              setImportError("");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3.5 py-2 text-xs font-semibold text-teal-800 transition-all hover:bg-teal-100 border border-teal-200 shadow-sm"
          >
            <Upload className="h-4 w-4 text-teal-600" />
            <span>Import CSV</span>
            <span className="rounded bg-teal-200/60 px-1 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-900">
              Pre-flight
            </span>
          </button>

          {/* Add Employee Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-all hover:bg-emerald-700 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Live Metric Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Headcount</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3.5 w-3.5" /> Active Staff
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Departments</span>
            <Building className="h-5 w-5 text-teal-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{departments.length}</span>
            <span className="text-xs text-slate-500">Corporate Units</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Designations</span>
            <UserCheck className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{designations.length}</span>
            <span className="text-xs text-purple-600 font-medium">Mapped Roles</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tax Compliant</span>
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600">100%</span>
            <span className="text-xs text-slate-500">FBR 2024-25</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, employee code, or email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PROBATION">Probation</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-xs font-semibold">Loading workforce records...</span>
          </div>
        </div>
      ) : employees.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center p-6">
          <Users className="h-10 w-10 text-slate-300 mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No employees found</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria or add new members to your corporate roster.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add First Employee
          </button>
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5">Designation</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Salary Package</th>
                  <th className="px-4 py-3.5">Joining Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const gross = emp.salaryStructure?.grossSalary || 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                            {emp.firstName[0]}
                            {emp.lastName[0]}
                          </div>
                          <div>
                            <Link
                              href={`/hr/employees/${emp.id}`}
                              className="font-bold text-slate-900 hover:text-emerald-700 transition-colors"
                            >
                              {emp.firstName} {emp.lastName}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-500">{emp.employeeCode}</span>
                              <span>•</span>
                              <span>{emp.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {emp.department?.name || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {emp.designation?.title || "Staff Member"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            emp.employmentStatus === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : emp.employmentStatus === "PROBATION"
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              emp.employmentStatus === "ACTIVE"
                                ? "bg-emerald-500"
                                : emp.employmentStatus === "PROBATION"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          ></span>
                          {emp.employmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-800">
                          PKR {gross.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-slate-400">Gross Monthly</span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">
                        {new Date(emp.joiningDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/hr/employees/${emp.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>360 Profile</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalCount} total staff)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-sm font-bold text-white shadow-sm">
                    {emp.firstName[0]}
                    {emp.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs text-slate-400">{emp.employeeCode}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    emp.employmentStatus === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {emp.employmentStatus}
                </span>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Designation</span>
                  <span className="font-semibold text-slate-800">
                    {emp.designation?.title || "Staff"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Department</span>
                  <span className="font-semibold text-slate-800">
                    {emp.department?.name || "General"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Monthly Gross</span>
                  <span className="font-bold text-emerald-700">
                    PKR {(emp.salaryStructure?.grossSalary || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href={`/hr/employees/${emp.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-600 hover:text-white transition-all"
                >
                  <Eye className="h-4 w-4" />
                  <span>View 360 Profile</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Employee</h2>
                  <p className="text-xs text-slate-500">
                    Create employee master record and initialize tax & leave structures.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-010"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Corporate Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="john.doe@hcmlite.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">Select Designation...</option>
                    {designations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Basic Salary (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">
                    Gross will automatically be PKR {(formData.basicSalary * 1.5).toLocaleString()} (Basic + 40% HRA + 10% Medical)
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Employee"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal with Dry-Run Preflight */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Bulk CSV Onboarding & Pre-Flight Validator
                  </h2>
                  <p className="text-xs text-slate-500">
                    Validate records with zero database writes before final commitment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center hover:border-teal-400 transition-colors">
                <Upload className="mx-auto h-8 w-8 text-teal-600 mb-2" />
                <p className="text-xs font-semibold text-slate-800">
                  Select employee roster CSV
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Headers required: Employee Code, First Name, Last Name, Email, Basic Salary
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImportFile(file);
                    setImportReport(null);
                    setImportError("");
                  }}
                  className="mt-3 text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
                />
              </div>

              {/* Validation Report Card */}
              {importReport && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Pre-Flight Validation Result
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        importReport.invalidCount === 0
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {importReport.invalidCount === 0 ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" /> 100% Valid & Ready
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3.5 w-3.5" /> {importReport.invalidCount} Issues
                          Found
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-white p-2.5 shadow-sm border border-slate-200">
                      <span className="block text-xs text-slate-400">Total Rows</span>
                      <span className="text-lg font-bold text-slate-800">
                        {importReport.totalRows}
                      </span>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200">
                      <span className="block text-xs text-emerald-600 font-semibold">Valid</span>
                      <span className="text-lg font-bold text-emerald-800">
                        {importReport.validCount}
                      </span>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2.5 border border-rose-200">
                      <span className="block text-xs text-rose-600 font-semibold">Invalid</span>
                      <span className="text-lg font-bold text-rose-800">
                        {importReport.invalidCount}
                      </span>
                    </div>
                  </div>

                  {importReport.issues && importReport.issues.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] space-y-1">
                      {importReport.issues.map((iss: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-rose-700">
                          <span>
                            Row {iss.row}: Field <strong>{iss.field}</strong>
                          </span>
                          <span>{iss.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!importFile || isDryRunning}
                  onClick={handleRunDryRun}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                >
                  {isDryRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Validating...
                    </>
                  ) : (
                    "Run Dry-Run Check"
                  )}
                </button>
                <button
                  type="button"
                  disabled={
                    !importFile ||
                    !importReport ||
                    importReport.invalidCount > 0 ||
                    isImporting
                  }
                  onClick={handleCommitImport}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                    </>
                  ) : (
                    "Commit Import"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
