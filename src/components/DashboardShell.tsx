"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AIChatDrawer from "@/components/AIChatDrawer";

interface DashboardShellProps {
  user: {
    id: string;
    email: string;
    role: "ADMIN" | "HR" | "EMPLOYEE";
    name?: string;
  };
  role: "ADMIN" | "HR" | "EMPLOYEE";
  children: React.ReactNode;
}

export default function DashboardShell({ user, role, children }: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (window.innerWidth < 1024) {
          setIsMobileOpen((prev) => !prev);
        } else {
          setIsCollapsed((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Shared Sidebar (flex sibling on desktop, drawer on mobile) */}
      <Sidebar
        role={role}
        isMobileOpen={isMobileOpen}
        isCollapsed={isCollapsed}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main content column - starts immediately after sidebar without any fixed padding offset */}
      <div className="flex flex-1 flex-col min-w-0 transition-all duration-300 ease-in-out">
        {/* Sticky Navbar with responsive hamburger toggle */}
        <Navbar
          user={user}
          isCollapsed={isCollapsed}
          onToggleSidebar={handleToggleSidebar}
          onOpenAIChat={() => setAiChatOpen(true)}
        />

        {/* Page content - natural full width without horizontal gaps */}
        <main className="flex-1 w-full px-4 py-6 sm:px-6 lg:px-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* AI Chat Drawer */}
      <AIChatDrawer
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        userRole={role}
      />
    </div>
  );
}
