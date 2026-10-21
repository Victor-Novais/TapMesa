"use client";

import { useState } from "react";
import { AuthGate } from "@/features/auth";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardSidebar } from "./_components/dashboard-sidebar";
import { DashboardBottomNav } from "./_components/dashboard-bottom-nav";
import { DashboardMobileDrawer } from "./_components/dashboard-mobile-drawer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <AuthGate allowedRoles={["OWNER", "ADMIN"]}>
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
        {/* Desktop / Tablet Sidebar */}
        <DashboardSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Mobile Navigation Drawer */}
        <DashboardMobileDrawer
          open={mobileDrawerOpen}
          onOpenChange={setMobileDrawerOpen}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <DashboardHeader onOpenMobileMenu={() => setMobileDrawerOpen(true)} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <DashboardBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
