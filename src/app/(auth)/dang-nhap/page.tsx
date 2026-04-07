"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError("Email hoặc mật khẩu không đúng");
        } else {
          setError(signInError.message);
        }
        return;
      }

      router.push("/bang-dieu-khien");
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="glass rounded-2xl p-8 shadow-[var(--shadow-glass)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">
            Đăng nhập
          </h1>
          <p className="text-sm text-[var(--color-surface-400)] mt-1">
            Hệ thống Quản lý Học viên
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#f87171",
            }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)] transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/quen-mat-khau"
              className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[var(--shadow-glow)] hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: loading
                ? "var(--color-surface-600)"
                : "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang đăng nhập...
              </span>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-surface-400)]">
            Chưa có tài khoản?{" "}
            <Link
              href="/dang-ky"
              className="text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] font-medium transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
