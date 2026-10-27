"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ScrollText } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { AuthGate } from "@/features/auth";
import { UserMenu } from "@/app/_components/user-menu";
import { SkipLink } from "@/shared/ui/skip-link";
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
      <SkipLink targetId="main-content" />
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-espresso px-4 text-on-espresso sm:px-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-espresso"
            >
              <BrandLogo size={36} tone="dark" alt="" priority />
              <div className="flex flex-col">
                <span className="text-base font-bold leading-tight text-on-espresso">
                  Aproxime Aí Admin
                </span>
                <span className="text-xs text-on-espresso-2">
                  Gestão Geral da Plataforma
                </span>
              </div>
            </Link>

            <nav
              className="hidden sm:flex items-center gap-1"
              aria-label="Navegação administrativa"
            >
              {ADMIN_NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium transition-colors duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-espresso",
                      isActive
                        ? "bg-white/12 font-semibold text-on-espresso"
                        : "text-on-espresso-2 hover:bg-white/8 hover:text-on-espresso",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
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
        <nav
          aria-label="Navegação administrativa móvel"
          className="sm:hidden flex items-center justify-around border-b border-border bg-nav px-4 py-2"
        >
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                  isActive
                    ? "bg-surface font-semibold text-ink shadow-elevation-1"
                    : "text-ink-2",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 sm:px-8 max-w-7xl w-full mx-auto focus:outline-none"
        >
          {children}
        </main>
      </div>
    </AuthGate>
  );
}
