"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, RefreshCcw, Loader2, CheckCircle2, AlertCircle, KeyRound } from "lucide-react";

interface UserRow {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  employee?: { firstName: string; lastName: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionResult, setActionResult] = useState<{ id: string; msg: string; ok: boolean } | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/org/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (userId: string, action: { isActive?: boolean; resetPassword?: boolean }) => {
    const res = await fetch("/api/org/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...action }),
    });
    const data = await res.json();
    if (res.ok) {
      setActionResult({ id: userId, msg: action.resetPassword ? `Temp password: ${data.temporaryPassword}` : (action.isActive ? "User activated." : "User deactivated."), ok: true });
      fetchUsers();
    } else {
      setActionResult({ id: userId, msg: data.error || "Action failed.", ok: false });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-outfit">User Access Management</h1>
            <p className="text-xs text-slate-500">Activate/deactivate accounts and reset passwords</p>
          </div>
        </div>
        <button onClick={fetchUsers} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
          <RefreshCcw className="h-3.5 w-3.5" />Refresh
        </button>
      </div>

      {actionResult && (
        <div className={`flex items-start gap-2 rounded-xl p-3 text-xs border ${actionResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
          {actionResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
          <span className="font-mono">{actionResult.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["User", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">
                      {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : "—"}
                    </div>
                    <div className="text-[10px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                      u.role === "HR" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    {u.mustChangePassword && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Must Reset</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAction(u.id, { isActive: !u.isActive })}
                        className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition ${u.isActive ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleAction(u.id, { resetPassword: true })}
                        className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                      >
                        <KeyRound className="h-3 w-3" />
                        Reset Pwd
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
