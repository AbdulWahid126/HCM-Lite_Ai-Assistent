"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Briefcase,
  Sparkles,
  MapPin,
  FileSpreadsheet,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  X,
  Copy,
  RefreshCcw,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpResult, setFpResult] = useState<{ tempPassword: string; userName: string } | null>(null);
  const [fpError, setFpError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const openForgotModal = () => {
    setFpEmail(email); // pre-fill with whatever is in the email field
    setFpResult(null);
    setFpError(null);
    setCopied(false);
    setShowForgotModal(true);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setFpEmail("");
    setFpResult(null);
    setFpError(null);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail || fpLoading) return;
    setFpLoading(true);
    setFpError(null);
    setFpResult(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: fpEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFpError(data.error || "Something went wrong. Please try again.");
      } else if (data.found && data.tempPassword) {
        setFpResult({ tempPassword: data.tempPassword, userName: data.userName });
      } else {
        setFpError("No active account found for this email. Please contact your system administrator.");
      }
    } catch {
      setFpError("Network error. Please check your connection.");
    } finally {
      setFpLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (fpResult?.tempPassword) {
      navigator.clipboard.writeText(fpResult.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Authentication failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      // Successful login - redirect to role dashboard
      router.push(data.redirectUrl || "/admin");
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please verify your connection or try again.");
      setIsLoading(false);
    }
  };

  const autofillPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Left Showcase Panel (55% width on desktop) */}
      <section className="relative hidden lg:flex w-full lg:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#033b2c] to-[#011f18] p-10 xl:p-14 text-white">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hcm-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#34d399" opacity="0.6" />
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#059669" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.4" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hcm-grid)" />
          </svg>
        </div>

        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        {/* Header & Brand */}
        <header className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 via-emerald-600 to-teal-500 text-white shadow-lg shadow-black/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-outfit">
                  HCM Lite
                </span>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                  v2.4 Enterprise
                </span>
              </div>
              <p className="text-[11px] font-medium tracking-wide text-emerald-200/70">
                AI-ASSISTED WORKFORCE ORCHESTRATION
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[12px] font-medium text-emerald-100 backdrop-blur-md border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FBR Tax Rules Synced</span>
          </div>
        </header>

        {/* Storyline & Headline */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4" />
            <span>Saylani Hackathon 2026 Production Build</span>
          </div>
          <h1 className="mb-4 text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight font-outfit">
            Intelligent Human Capital Management for Modern Workforces
          </h1>
          <p className="mb-8 text-sm leading-relaxed text-slate-200/90">
            Streamline company attendance, geofenced punctuality, automated payroll taxation compliance, and role-governed AI operations in one unified workspace.
          </p>

          {/* 3 Glassmorphism Bento Cards */}
          <div className="space-y-3">
            <div className="group rounded-xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md transition-all hover:bg-white/[0.12] hover:border-emerald-400/40">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/20 text-emerald-300">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">
                    Automated Punctuality & Geofencing
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-300 leading-normal">
                    Office 09:00 AM start rule with 15-minute grace period (arrival &gt; 09:15 is late) and 150m Haversine validation.
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md transition-all hover:bg-white/[0.12] hover:border-emerald-400/40">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-teal-400/30 bg-teal-400/20 text-teal-300">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">
                    Compliant Payroll & Tax Engine
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-300 leading-normal">
                    Exact HRA (40%), Medical (10%), gross calculations, absent/half-day deductions, and annualized progressive tax slabs.
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md transition-all hover:bg-white/[0.12] hover:border-emerald-400/40">
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/20 text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-outfit">
                    Server-Governed AI Operations
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-300 leading-normal">
                    Strict role boundaries prevent employee access to peer salaries; smart natural-language leave extraction requires user confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-slate-400">
          <span>HCM Lite Platform</span>
          <span>© 2026 Saylani Hackathon • Production-Ready</span>
        </footer>
      </section>

      {/* Right Authentication Form Panel (45% width) */}
      <section className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-outfit">HCM Lite</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-outfit">
              Sign In to Your Workspace
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter your enterprise credentials to access your dashboard.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotModal}
                  className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Evaluator Quick-Fill Email Helper (Safe helper that fills email only) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-600">Evaluator Email Presets:</span>
              <span className="text-[10px] text-slate-400">Click to fill email</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => autofillPreset("admin@hcmlite.com")}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
              >
                admin@hcmlite.com
              </button>
            </div>
          </div>

          {/* First Run Setup Notice */}
          <div className="text-center text-xs text-slate-500 pt-2">
            First time opening a fresh instance?{" "}
            <Link href="/setup" className="font-semibold text-emerald-600 hover:underline">
              Run Company Setup Wizard →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Forgot Password Modal ── */}
      {showForgotModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) closeForgotModal(); }}
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            {/* Close button */}
            <button
              onClick={closeForgotModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                <p className="text-[11px] text-slate-500">Generate a new temporary password</p>
              </div>
            </div>

            {!fpResult ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Your Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition"
                    />
                  </div>
                </div>

                {fpError && (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
                    <span>{fpError}</span>
                  </div>
                )}

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-700 leading-relaxed">
                  <strong>Note:</strong> A temporary password will be displayed on screen. You will be required to change it immediately after signing in.
                </div>

                <button
                  type="submit"
                  disabled={fpLoading || !fpEmail}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {fpLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span>Generating...</span></>
                  ) : (
                    <><RefreshCcw className="h-4 w-4" /><span>Generate Temporary Password</span></>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Password reset for {fpResult.userName}</p>
                    <p className="text-[11px] text-emerald-600">Use the temporary password below to sign in.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Temporary Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-2.5 font-mono text-sm font-bold tracking-widest text-emerald-800 select-all">
                      {fpResult.tempPassword}
                    </div>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition"
                      title="Copy to clipboard"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 leading-relaxed">
                  <strong>⚠ Important:</strong> Copy this password now. For security, it will not be shown again. You <strong>must change it</strong> immediately after signing in.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(fpEmail);
                      closeForgotModal();
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                  >
                    Go to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFpResult(null); setFpError(null); }}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Reset Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
