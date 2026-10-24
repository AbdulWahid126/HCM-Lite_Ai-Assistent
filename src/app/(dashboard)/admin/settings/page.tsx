"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Loader2, CheckCircle2, AlertCircle, MapPin } from "lucide-react";

interface OrgSettings {
  officeStartTime: string;
  gracePeriodMinutes: number;
  halfDayThresholdHours: number;
  geofenceLatitude: number | null;
  geofenceLongitude: number | null;
  geofenceRadiusMeters: number;
  weekendDays: string[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/org/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/org/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to save settings.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleWeekend = (day: string) => {
    if (!settings) return;
    const current = settings.weekendDays || [];
    setSettings({
      ...settings,
      weekendDays: current.includes(day) ? current.filter((d) => d !== day) : [...current, day],
    });
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  if (!settings) return <div className="text-xs text-slate-500 p-8">Could not load settings.</div>;

  return (
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-outfit">Organization Settings</h1>
          <p className="text-xs text-slate-500">Office rules, geofence, and attendance policies</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Office Hours */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Office Hours & Attendance Rules</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Office Start Time</label>
              <input
                type="time"
                value={settings.officeStartTime}
                onChange={(e) => setSettings({ ...settings, officeStartTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Grace Period (mins)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={settings.gracePeriodMinutes}
                onChange={(e) => setSettings({ ...settings, gracePeriodMinutes: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Half-Day Threshold (hrs)</label>
              <input
                type="number"
                min={1}
                max={8}
                step={0.5}
                value={settings.halfDayThresholdHours}
                onChange={(e) => setSettings({ ...settings, halfDayThresholdHours: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Weekend Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeekend(day)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    settings.weekendDays?.includes(day)
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {day.charAt(0) + day.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Geofence */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Geofence Configuration</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Latitude</label>
              <input
                type="number"
                step={0.0001}
                value={settings.geofenceLatitude ?? ""}
                onChange={(e) => setSettings({ ...settings, geofenceLatitude: parseFloat(e.target.value) })}
                placeholder="24.8607"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Longitude</label>
              <input
                type="number"
                step={0.0001}
                value={settings.geofenceLongitude ?? ""}
                onChange={(e) => setSettings({ ...settings, geofenceLongitude: parseFloat(e.target.value) })}
                placeholder="67.0011"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Radius (meters)</label>
              <input
                type="number"
                min={50}
                max={5000}
                value={settings.geofenceRadiusMeters}
                onChange={(e) => setSettings({ ...settings, geofenceRadiusMeters: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Haversine formula validation. Default: Karachi HQ (24.8607°N, 67.0011°E, 150m)</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />Settings saved successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
