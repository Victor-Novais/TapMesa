"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, QrCode, Users, Settings, Radio } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { UI_MESSAGES } from "@/shared/messages/ui";

const BOTTOM_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: UI_MESSAGES.nav.dashboard,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/tables",
    label: UI_MESSAGES.nav.tables,
    icon: QrCode,
    exact: false,
  },
  {
    href: "/dashboard/team",
    label: UI_MESSAGES.nav.team,
    icon: Users,
    exact: false,
  },
  {
    href: "/dashboard/settings",
    label: UI_MESSAGES.nav.settings,
    icon: Settings,
    exact: false,
  },
  {
    href: "/panel",
    label: "Painel",
    icon: Radio,
    exact: false,
  },
];

export function DashboardBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação móvel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-nav pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
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
                "relative flex min-h-12 min-w-12 flex-col items-center justify-center gap-1 rounded-control px-2 py-1 text-xs font-medium transition-colors duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                // Ativo: tinta + traço Terracotta acima do ícone (não só cor)
                isActive
                  ? "font-semibold text-ink before:absolute before:top-0 before:h-[3px] before:w-6 before:rounded-full before:bg-brand"
                  : "text-ink-2 hover:text-ink",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
