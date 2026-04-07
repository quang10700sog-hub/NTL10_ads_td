"use client";

import { useUser } from "@/lib/hooks/use-user";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ToastProvider } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/dang-nhap");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-950)] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 text-[var(--color-primary-500)] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-[var(--color-surface-400)]">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-surface-950)] flex">
        <Sidebar
          profile={profile}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div
          className="flex-1 min-w-0 flex flex-col transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
        >
          <Header profile={profile} />
          <main className="flex-1 p-6 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
