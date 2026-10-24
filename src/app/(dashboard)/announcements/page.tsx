"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, X, Loader2, AlertCircle, ChevronDown } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  targetRole: string | null;
  author: { email: string };
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-rose-100 text-rose-700 border-rose-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPost, setCanPost] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", priority: "NORMAL", targetRole: "" });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const [annRes, meRes] = await Promise.all([fetch("/api/announcements"), fetch("/api/auth/me")]);
      if (annRes.ok) {
        const data = await annRes.json();
        setAnnouncements(data.announcements || []);
      }
      if (meRes.ok) {
        const me = await meRes.json();
        setCanPost(me.role === "ADMIN" || me.role === "HR");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          priority: form.priority,
          targetRole: form.targetRole || null,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({ title: "", body: "", priority: "NORMAL", targetRole: "" });
        fetchAnnouncements();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to post announcement.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-outfit">Company Announcements</h1>
            <p className="text-xs text-slate-500">Company-wide broadcasts and updates</p>
          </div>
        </div>
        {canPost && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Plus className="h-4 w-4" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
          <Megaphone className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm font-semibold text-slate-500">No announcements yet</p>
          <p className="text-xs text-slate-400 mt-1">Check back later for company updates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[a.priority]}`}>
                      {a.priority}
                    </span>
                    {a.targetRole && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">
                        {a.targetRole} only
                      </span>
                    )}
                  </div>
                  <h2 className="text-sm font-bold text-slate-900">{a.title}</h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{a.body}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-slate-50 pt-3 text-[10px] text-slate-400">
                <span>By {a.author?.email ?? "System"}</span>
                <span>•</span>
                <span>{new Date(a.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="text-base font-bold text-slate-900 mb-5">Post Announcement</h3>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief announcement title"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Full announcement text..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Audience</label>
                  <select
                    value={form.targetRole}
                    onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admins only</option>
                    <option value="HR">HR only</option>
                    <option value="EMPLOYEE">Employees only</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={posting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                {posting ? "Posting..." : "Post Announcement"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
