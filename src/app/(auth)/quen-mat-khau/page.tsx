"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/dat-lai-mat-khau`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="glass rounded-2xl p-8 shadow-[var(--shadow-glass)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="m7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">
            Quên mật khẩu
          </h1>
          <p className="text-sm text-[var(--color-surface-400)] mt-1">
            Nhập email để nhận link đặt lại mật khẩu
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="mb-4 p-4 rounded-lg"
              style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", color: "#4ade80" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="font-medium">Đã gửi email!</p>
              <p className="text-sm mt-1 opacity-80">
                Kiểm tra hộp thư của bạn và nhấn vào link để đặt lại mật khẩu.
              </p>
            </div>
            <Link href="/dang-nhap" className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors">
              ← Quay về trang đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow)] hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: loading ? "var(--color-surface-600)" : "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))",
                }}
              >
                {loading ? "Đang gửi..." : "Gửi link đặt lại"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/dang-nhap" className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors">
                ← Quay về trang đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
