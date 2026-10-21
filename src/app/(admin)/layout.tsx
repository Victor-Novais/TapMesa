"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, Building2, ScrollText } from "lucide-react";
import { AuthGate } from "@/features/auth";
import { UserMenu } from "@/app/_components/user-menu";
import { cn } from "@/shared/lib/cn";
import { UI_MESSAGES } from "@/shared/messages/ui";

const ADMIN_NAV_ITEMS = [
  {
    href: "/admin",
    label: UI_MESSAGES.nav.adminRestaurants,
    icon: Building2,
    exact: true,
  },
  {
    href: "/admin/audit",
    label: UI_MESSAGES.nav.adminAudit,
    icon: ScrollText,
    exact: false,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AuthGate allowedRoles={["ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/95 px-4 sm:px-8 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow dark:bg-white dark:text-zinc-900">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold leading-tight text-zinc-900 dark:text-zinc-100">
                  TapMesa Admin
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Gestão Geral da Plataforma
                </span>
              </div>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 font-semibold"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <UserMenu />
          </div>
        </header>

        {/* Mobile secondary nav for admin */}
        <div className="sm:hidden border-b border-zinc-200 bg-white px-4 py-2 flex items-center justify-around dark:border-zinc-800 dark:bg-zinc-900">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                    : "text-zinc-600 dark:text-zinc-400",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <main className="flex-1 px-4 py-6 sm:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
