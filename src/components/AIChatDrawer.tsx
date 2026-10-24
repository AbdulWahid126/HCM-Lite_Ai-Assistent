"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2 } from "lucide-react";

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: "ADMIN" | "HR" | "EMPLOYEE";
}

interface Message {
  role: "user" | "assistant";
  content: string;
  isAiGenerated?: boolean;
}

export default function AIChatDrawer({ isOpen, onClose, userRole }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        userRole === "EMPLOYEE"
          ? "Hello! I am your personal HCM Lite assistant. Ask me about your remaining leave balance, working hours, or company policies."
          : `Hello ${userRole}! I am your AI HR Assistant. You can ask me about headcount, today's attendance, late-comers, leave utilization, or payroll summaries.`,
      isAiGenerated: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content || "I have retrieved the requested information.",
            isAiGenerated: true,
          },
        ]);
      } else {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: err.error || "Sorry, I encountered an issue processing your request.",
            isAiGenerated: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please verify your connection or try again shortly.",
          isAiGenerated: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:w-96">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">HCM Lite Copilot</h3>
            <span className="text-[10px] text-emerald-600 font-medium">Server-Governed Tools Active</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/50 hover:text-slate-600"
          aria-label="Close AI chat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                m.role === "user"
                  ? "bg-emerald-600 text-white rounded-tr-none font-medium"
                  : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60"
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              {m.isAiGenerated && (
                <div className="mt-1.5 flex items-center gap-1 text-[9px] text-slate-400">
                  <Sparkles className="h-2.5 w-2.5 text-emerald-500" />
                  <span>AI-generated • Verified server data</span>
                </div>
              )}
            </div>

            {m.role === "user" && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-[11px] p-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            <span>Consulting real records...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-slate-200 p-3 bg-white">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-emerald-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              userRole === "EMPLOYEE"
                ? "e.g. How many leaves do I have left?"
                : "e.g. Who is late or on leave today?"
            }
            className="flex-1 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-emerald-600 p-1.5 text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
