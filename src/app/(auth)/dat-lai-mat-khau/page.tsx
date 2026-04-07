"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Sign out and redirect to login
      await supabase.auth.signOut();
      router.push("/dang-nhap?reset=success");
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
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">
            Đặt lại mật khẩu
          </h1>
          <p className="text-sm text-[var(--color-surface-400)] mt-1">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)]"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
            />
          </div>

          <button
            id="reset-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow)] hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: loading ? "var(--color-surface-600)" : "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))",
            }}
          >
            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
