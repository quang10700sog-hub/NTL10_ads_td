"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/dang-nhap");
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-[var(--color-surface-800)] bg-[var(--color-surface-950)]/80 backdrop-blur-lg flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left: Breadcrumb / Title */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-surface-100)]">
          Hệ thống Quản lý Học viên
        </h2>
      </div>

      {/* Right: User menu */}
      <div className="relative" ref={menuRef}>
        <button
          id="user-menu-btn"
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-800)] transition-all"
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[var(--color-surface-200)]">
              {profile.full_name}
            </p>
            <p className="text-xs text-[var(--color-surface-500)]">
              {ROLE_LABELS[profile.role ?? "admin"]}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-[var(--color-surface-400)] transition-transform ${showMenu ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] shadow-[var(--shadow-elevated)] py-1 animate-fade-in">
            <div className="px-4 py-3 border-b border-[var(--color-surface-700)]">
              <p className="text-sm font-medium text-[var(--color-surface-200)]">{profile.full_name}</p>
              <p className="text-xs text-[var(--color-surface-500)]">{profile.email}</p>
            </div>
            <button
              id="signout-btn"
              onClick={handleSignOut}
              className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-[var(--color-surface-700)] flex items-center gap-2 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
