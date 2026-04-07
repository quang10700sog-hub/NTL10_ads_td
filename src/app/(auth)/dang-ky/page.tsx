"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/types";
import type { UserRole } from "@/lib/types";

const REGISTRATION_ROLES: { value: Exclude<UserRole, "admin">; label: string }[] = [
  { value: "dvt", label: ROLE_LABELS.dvt },
  { value: "kvt", label: ROLE_LABELS.kvt },
  { value: "ntd", label: ROLE_LABELS.ntd },
  { value: "tuvanvien", label: ROLE_LABELS.tuvanvien },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<Exclude<UserRole, "admin">>("tuvanvien");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
            password_plain: password,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Email đã được đăng ký");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      // Go straight to dashboard
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
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-surface-50)]">
            Đăng ký tài khoản
          </h1>
          <p className="text-sm text-[var(--color-surface-400)] mt-1">
            Tạo tài khoản mới để tham gia hệ thống
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
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Họ và tên
            </label>
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Vai trò
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REGISTRATION_ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                    selectedRole === r.value
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-600)]/15 text-[var(--color-primary-300)]"
                      : "border-[var(--color-surface-700)] bg-[var(--color-surface-800)] text-[var(--color-surface-400)] hover:border-[var(--color-surface-600)] hover:text-[var(--color-surface-300)]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="register-password"
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

          <div>
            <label className="block text-sm font-medium text-[var(--color-surface-300)] mb-1.5">
              Xác nhận mật khẩu
            </label>
            <input
              id="register-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] text-[var(--color-surface-100)] placeholder-[var(--color-surface-500)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-1 focus:ring-[var(--color-primary-500)] transition-all"
            />
          </div>

          <button
            id="register-submit"
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
                Đang đăng ký...
              </span>
            ) : (
              "Đăng ký"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-surface-400)]">
            Đã có tài khoản?{" "}
            <Link
              href="/dang-nhap"
              className="text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] font-medium transition-colors"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
