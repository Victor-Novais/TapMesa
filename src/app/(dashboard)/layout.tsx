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
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 print:bg-white print:min-h-0 print:block">
        {/* Desktop / Tablet Sidebar */}
        <div className="print:hidden">
          <DashboardSidebar
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
        </div>

        {/* Mobile Navigation Drawer */}
        <div className="print:hidden">
          <DashboardMobileDrawer
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0 print:block print:w-full">
          <div className="print:hidden">
            <DashboardHeader
              onOpenMobileMenu={() => setMobileDrawerOpen(true)}
            />
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto print:p-0 print:m-0 print:max-w-none print:w-full">
            {children}
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="print:hidden">
            <DashboardBottomNav />
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
