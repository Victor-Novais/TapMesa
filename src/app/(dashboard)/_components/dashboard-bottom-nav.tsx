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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
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
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition-colors min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
                isActive
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-zinc-500 dark:text-zinc-400",
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
