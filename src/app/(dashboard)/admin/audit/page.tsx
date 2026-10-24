"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Clock } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedByEmail: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/audit?page=${page}&limit=${LIMIT}`)
      .then((r) => r.json())
      .then((d) => { setLogs(d.logs || []); setTotal(d.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-outfit">Immutable Audit Log</h1>
          <p className="text-xs text-slate-500">All system events — read-only, tamper-proof</p>
        </div>
        <span className="ml-auto rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {total} total events
        </span>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Timestamp", "Action", "Entity", "Entity ID", "Performed By", "Details"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No audit events yet</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {new Date(log.createdAt).toLocaleString("en-PK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">{log.action}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{log.entityType}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-[100px]">{log.entityId.slice(0, 8)}…</td>
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[180px]">{log.performedByEmail}</td>
                  <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">
                    {log.details ? JSON.stringify(log.details).slice(0, 50) + (JSON.stringify(log.details).length > 50 ? "…" : "") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
