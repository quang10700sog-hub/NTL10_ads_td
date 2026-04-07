"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

const COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.3)", text: "#4ade80", icon: "#22c55e" },
  error: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", text: "#f87171", icon: "#ef4444" },
  warning: { bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", text: "#fbbf24", icon: "#f59e0b" },
  info: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.3)", text: "#60a5fa", icon: "#3b82f6" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const value: ToastContextType = {
    addToast,
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warning: (msg) => addToast(msg, "warning"),
    info: (msg) => addToast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 400 }}>
        {toasts.map((toast) => {
          const color = COLORS[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
                toast.exiting ? "toast-exit" : "toast-enter"
              }`}
              style={{
                background: color.bg,
                border: `1px solid ${color.border}`,
                backdropFilter: "blur(12px)",
              }}
            >
              <span style={{ color: color.icon }} className="flex-shrink-0">
                {ICONS[toast.type]}
              </span>
              <p className="text-sm font-medium flex-1" style={{ color: color.text }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: color.text }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
