"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface SidebarProps {
  profile: Profile;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    title: "Tổng quan",
    href: "/bang-dieu-khien",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    title: "Khóa học",
    href: "/quan-tri/khoa-hoc",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "Học viên",
    href: "/hoc-vien",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Người dùng",
    href: "/quan-tri/nguoi-dung",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    adminOnly: true,
  },
];

export function Sidebar({ profile, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === "admin";

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 flex flex-col transition-all duration-300 border-r border-[var(--color-surface-800)] ${
        collapsed ? "w-20" : "w-64"
      }`}
      style={{ background: "var(--color-surface-900)" }}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-[var(--color-surface-800)]">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-primary-600), var(--color-primary-400))" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 12 3 12 0v-5" />
            </svg>
          </div>
          {!collapsed && (
            <span className="font-bold text-[var(--color-surface-100)] truncate">
              Quản lý HV
            </span>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive
                  ? "bg-[var(--color-primary-600)]/15 text-[var(--color-primary-400)]"
                  : "text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)] hover:bg-[var(--color-surface-800)]"
              }`}
              title={collapsed ? item.title : undefined}
            >
              <span className={`flex-shrink-0 ${isActive ? "text-[var(--color-primary-400)]" : ""}`}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.title}
                </span>
              )}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary-400)]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 border-t border-[var(--color-surface-800)]">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))" }}>
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-surface-200)] truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-[var(--color-surface-500)] truncate">
                {ROLE_LABELS[profile.role ?? "admin"]}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--color-surface-800)] border border-[var(--color-surface-700)] flex items-center justify-center text-[var(--color-surface-400)] hover:text-[var(--color-surface-200)] hover:bg-[var(--color-surface-700)] transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  );
}
