"use client";

import React, { useState } from "react";
import { Sparkles, X, Check, Loader2, Calendar } from "lucide-react";

interface SmartLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: Array<{ id: string; name: string }>;
  onConfirm: (leaveData: {
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) => void;
}

export default function SmartLeaveModal({
  isOpen,
  onClose,
  leaveTypes,
  onConfirm,
}: SmartLeaveModalProps) {
  const [prompt, setPrompt] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<{
    leaveTypeId?: string;
    leaveTypeName?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExtracting) return;

    setIsExtracting(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/smart-leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (res.ok) {
        const data = await res.json();
        setExtractedData(data.extraction);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to extract leave request");
      }
    } catch {
      setError("Network error while communicating with AI service");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmAndApply = () => {
    if (!extractedData?.startDate || !extractedData?.endDate) {
      setError("Start date and end date are required");
      return;
    }

    const matchedType =
      leaveTypes.find((t) => t.id === extractedData.leaveTypeId) ||
      leaveTypes.find((t) => t.name.toLowerCase() === extractedData.leaveTypeName?.toLowerCase()) ||
      leaveTypes[0];

    onConfirm({
      leaveTypeId: matchedType?.id || "",
      startDate: extractedData.startDate,
      endDate: extractedData.endDate,
      reason: extractedData.reason || prompt,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Smart Natural-Language Leave</h3>
              <p className="text-[11px] text-slate-400">Describe your leave in plain words</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!extractedData ? (
          <form onSubmit={handleExtract} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Write your request naturally:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="e.g. I need next Monday and Tuesday off for my sister's wedding."
                className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!prompt.trim() || isExtracting}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract Details</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2.5 text-xs">
              <span className="font-bold text-emerald-800 uppercase tracking-wide text-[10px]">
                Review Extracted Details
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px]">Start Date</span>
                  <input
                    type="date"
                    value={extractedData.startDate || ""}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, startDate: e.target.value })
                    }
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">End Date</span>
                  <input
                    type="date"
                    value={extractedData.endDate || ""}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, endDate: e.target.value })
                    }
                    className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Leave Type</span>
                <select
                  value={extractedData.leaveTypeId || ""}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, leaveTypeId: e.target.value })
                  }
                  className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Reason</span>
                <input
                  type="text"
                  value={extractedData.reason || ""}
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, reason: e.target.value })
                  }
                  className="mt-0.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              * Verification notice: You are reviewing extracted details. AI will never submit requests without your manual confirmation.
            </p>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                ← Edit prompt
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndApply}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirm & Apply</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
