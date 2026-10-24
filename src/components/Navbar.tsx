"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LogOut,
  User,
  Shield,
  Briefcase,
  Sparkles,
  Menu,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";

interface NavbarProps {
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "HR" | "EMPLOYEE";
    name?: string;
  };
  isCollapsed?: boolean;
  onToggleSidebar?: () => void;
  onOpenAIChat?: () => void;
}

export default function Navbar({
  user,
  isCollapsed = false,
  onToggleSidebar,
  onOpenAIChat,
}: NavbarProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // quiet fail
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      setUnreadCount(0);
      fetchNotifications();
    } catch (e) {}
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  const roleBadgeColor =
    user.role === "ADMIN"
      ? "bg-purple-100 text-purple-800 border-purple-200"
      : user.role === "HR"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-emerald-100 text-emerald-800 border-emerald-200";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Hamburger Toggle & Breadcrumb / Brand */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all active:scale-95"
            aria-label={isCollapsed ? "Expand sidebar navigation" : "Collapse sidebar navigation"}
            title={isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-extrabold leading-none text-slate-900">
              HCM <span className="text-emerald-600">Lite</span>
            </span>
            <span className="text-[9px] font-medium tracking-wide text-slate-400">
              WORKFORCE PLATFORM
            </span>
          </div>
        </Link>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* AI Assistant Quick Trigger */}
        {onOpenAIChat && (
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 hover:shadow-xs"
            title="Open AI Assistant"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl sm:w-96">
              <div className="mb-2 flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`rounded-xl p-2.5 text-xs transition ${
                        n.isRead ? "bg-slate-50 text-slate-600" : "bg-emerald-50/50 text-slate-900 font-medium"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-500 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800">{user.name || user.email}</span>
            <span
              className={`inline-block self-end rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${roleBadgeColor}`}
            >
              {user.role}
            </span>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs border border-slate-200">
            {user.name ? user.name.charAt(0).toUpperCase() : user.role.charAt(0)}
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600 transition"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
