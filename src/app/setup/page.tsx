"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Calendar,
  Lock,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [alreadySetup, setAlreadySetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form Fields with validated production defaults matching the Hackathon brief
  const [companyName, setCompanyName] = useState("Saylani Tech Ventures");
  const [adminEmail, setAdminEmail] = useState("admin@hcmlite.com");
  const [adminPassword, setAdminPassword] = useState("AdminPassword123!");
  const [confirmPassword, setConfirmPassword] = useState("AdminPassword123!");

  const [officeStartTime, setOfficeStartTime] = useState("09:00");
  const [gracePeriodMins, setGracePeriodMins] = useState(15);
  const [halfDayHours, setHalfDayHours] = useState(5.0);
  const [weekendSat, setWeekendSat] = useState(true);
  const [weekendSun, setWeekendSun] = useState(true);
  const [weekendFri, setWeekendFri] = useState(false);

  const [officeLatitude, setOfficeLatitude] = useState(24.8607);
  const [officeLongitude, setOfficeLongitude] = useState(67.0011);
  const [geofenceRadius, setGeofenceRadius] = useState(150);

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch("/api/auth/setup");
        if (res.ok) {
          const data = await res.json();
          if (!data.isSetupNeeded) {
            setAlreadySetup(true);
          }
        }
      } catch {
        // Proceed gracefully
      } finally {
        setIsCheckingSetup(false);
      }
    }
    checkSetup();
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (step === 1) {
      if (!companyName.trim()) {
        setErrorMessage("Company name is required.");
        return;
      }
      if (!adminEmail.trim()) {
        setErrorMessage("Admin email is required.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (adminPassword.length < 8) {
      setErrorMessage("Admin password must be at least 8 characters long.");
      return;
    }

    if (adminPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    // Build weekend days string
    const weekends: string[] = [];
    if (weekendSat) weekends.push("SATURDAY");
    if (weekendSun) weekends.push("SUNDAY");
    if (weekendFri) weekends.push("FRIDAY");
    const weekendDays = weekends.join(",") || "SATURDAY,SUNDAY";

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword,
          officeStartTime,
          gracePeriodMins: Number(gracePeriodMins),
          weekendDays,
          officeLatitude: Number(officeLatitude),
          officeLongitude: Number(officeLongitude),
          geofenceRadius: Number(geofenceRadius),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Setup failed. Please check inputs.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch {
      setErrorMessage("Network error during setup. Please try again.");
      setIsLoading(false);
    }
  };

  if (isCheckingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
          <span>Verifying workspace status...</span>
        </div>
      </div>
    );
  }

  if (alreadySetup && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 font-outfit">
            Setup Already Completed
          </h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            This workspace has already been initialized with an administrator account and core organization rules.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Go to Sign In →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-3.5">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm">
              H
            </div>
            <span className="text-base font-bold text-slate-900 font-outfit">HCM Lite</span>
            <div className="h-4 w-px bg-slate-200" />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 tracking-wider uppercase">
              Initial Workspace Setup
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Saylani Hackathon 2026 Engine</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {/* Hackathon Preset Banner */}
        <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
              </span>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider font-outfit">
                Evaluator Quick-Start Preset
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-emerald-800/80">
                Pre-filled with official challenge rules (09:00 start, 15m grace, 150m geofence)
              </span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700">
              Step {step} of 3
            </div>
          </div>
        </div>

        {/* Wizard Main Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {/* Top Progress Ribbon */}
          <div className="h-1.5 w-full bg-slate-100">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/50 p-2 sm:p-3 gap-2">
            <div
              onClick={() => setStep(1)}
              className={`flex items-center gap-2.5 rounded-xl p-2.5 transition cursor-pointer ${
                step === 1 ? "bg-white shadow-xs border border-slate-200" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step > 1 ? "bg-emerald-600 text-white" : step === 1 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Step 01</div>
                <div className="text-xs font-bold text-slate-800">Organization</div>
              </div>
            </div>

            <div
              onClick={() => setStep(2)}
              className={`flex items-center gap-2.5 rounded-xl p-2.5 transition cursor-pointer ${
                step === 2 ? "bg-white shadow-xs border border-slate-200" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step > 2 ? "bg-emerald-600 text-white" : step === 2 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Step 02</div>
                <div className="text-xs font-bold text-slate-800">Office & Rules</div>
              </div>
            </div>

            <div
              onClick={() => setStep(3)}
              className={`flex items-center gap-2.5 rounded-xl p-2.5 transition cursor-pointer ${
                step === 3 ? "bg-white shadow-xs border border-slate-200" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
                  step === 3 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                3
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Step 03</div>
                <div className="text-xs font-bold text-slate-800">Master Admin</div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mx-6 mt-6 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {/* Success Celebration Screen */}
            {isSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-md">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 font-outfit">
                  Organization Initialized Successfully!
                </h2>
                <p className="mx-auto max-w-md text-xs text-slate-500 leading-relaxed">
                  The company profile, office rules, default leave types (Annual 14, Sick 8, Casual 10), standard departments, and your Master Admin account have been created.
                </p>

                <div className="mx-auto max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Company:</span>
                    <span className="font-bold text-slate-800">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Admin Email:</span>
                    <span className="font-bold text-slate-800">{adminEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Office Hours:</span>
                    <span className="font-bold text-slate-800">{officeStartTime} (Grace: {gracePeriodMins}m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Geofence:</span>
                    <span className="font-bold text-slate-800">{geofenceRadius} meters</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* STEP 1: Organization Profile */}
                {step === 1 && (
                  <form onSubmit={handleNextStep} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-outfit">
                        Step 1: Company Profile
                      </h2>
                      <p className="text-xs text-slate-500">
                        Enter your primary organization details.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Company Legal Name
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Saylani Tech Ventures"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Admin Contact Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            placeholder="admin@hcmlite.com"
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <span>Next: Office & Attendance Rules</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: Office Rules & Geofence */}
                {step === 2 && (
                  <form onSubmit={handleNextStep} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-outfit">
                        Step 2: Office Hours, Geofencing & Quotas
                      </h2>
                      <p className="text-xs text-slate-500">
                        Configure daily punctuality rules, weekend days, and geofencing.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Office Start Time (HH:mm)
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="time"
                            required
                            value={officeStartTime}
                            onChange={(e) => setOfficeStartTime(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 09:00 AM</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Grace Period (Minutes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="120"
                          required
                          value={gracePeriodMins}
                          onChange={(e) => setGracePeriodMins(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                        />
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Arrival after 09:15 is marked LATE</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Half-Day Threshold (Hours)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="12"
                          required
                          value={halfDayHours}
                          onChange={(e) => setHalfDayHours(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                        />
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Worked &lt; 5.0h = HALF DAY</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Geofence Radius (Meters)
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="number"
                            min="20"
                            max="5000"
                            required
                            value={geofenceRadius}
                            onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Default: 150m from office coordinates</span>
                      </div>
                    </div>

                    {/* Weekend Checkboxes */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Configured Weekend Days
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={weekendSat}
                            onChange={(e) => setWeekendSat(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Saturday</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={weekendSun}
                            onChange={(e) => setWeekendSun(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Sunday</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={weekendFri}
                            onChange={(e) => setWeekendFri(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Friday</span>
                        </label>
                      </div>
                    </div>

                    {/* Leave Quotas Info Card */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs">
                      <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider block mb-1">
                        Default Leave Quotas Generated Automatically:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>• Annual: <strong>14 Days</strong></div>
                        <div>• Sick: <strong>8 Days</strong></div>
                        <div>• Casual: <strong>10 Days</strong></div>
                        <div>• Unpaid: <strong>Unlimited</strong></div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        <span>Next: Master Admin Setup</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Master Admin Account */}
                {step === 3 && (
                  <form onSubmit={handleFinalSubmit} className="space-y-5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-outfit">
                        Step 3: Master Administrator Account
                      </h2>
                      <p className="text-xs text-slate-500">
                        Create the primary administrator credentials to manage your workspace.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                          Administrator Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Password (min 8 characters)
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={adminPassword}
                              onChange={(e) => setAdminPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 transition"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Initializing Workspace...</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Setup</span>
                            <CheckCircle2 className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-3.5 text-center text-xs text-slate-400">
        HCM Lite Enterprise Platform • Saylani Hackathon 2026 Build
      </footer>
    </div>
  );
}
