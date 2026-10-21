"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Users,
  Settings,
  Radio,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { UI_MESSAGES } from "@/shared/messages/ui";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export const DASHBOARD_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: UI_MESSAGES.nav.dashboard,
    description: UI_MESSAGES.nav.dashboardDesc,
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/dashboard/tables",
    label: UI_MESSAGES.nav.tables,
    description: UI_MESSAGES.nav.tablesDesc,
    icon: QrCode,
    exact: false,
  },
  {
    href: "/dashboard/team",
    label: UI_MESSAGES.nav.team,
    description: UI_MESSAGES.nav.teamDesc,
    icon: Users,
    exact: false,
  },
  {
    href: "/dashboard/settings",
    label: UI_MESSAGES.nav.settings,
    description: UI_MESSAGES.nav.settingsDesc,
    icon: Settings,
    exact: false,
  },
];

export function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  className,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-zinc-200 bg-white transition-all duration-200 dark:border-zinc-800 dark:bg-zinc-950",
          isCollapsed ? "w-[68px]" : "w-60",
          className,
        )}
      >
        {/* Logo / Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden font-bold text-zinc-900 dark:text-zinc-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm shadow-orange-600/30">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="truncate text-base tracking-tight font-extrabold">
                TapMesa
              </span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label={
              isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"
            }
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            const buttonContent = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform group-hover:scale-105",
                    isActive
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-200",
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </nav>

        {/* Operational Panel Fast Link */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/panel"
                  className="flex h-10 w-full items-center justify-center rounded-xl bg-orange-600/10 text-orange-600 transition-colors hover:bg-orange-600/20 dark:bg-orange-950/40 dark:text-orange-400"
                >
                  <Radio className="h-5 w-5 animate-pulse" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                Painel de Atendimento
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/panel"
              className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2.5 text-sm font-semibold text-orange-600 transition-colors hover:bg-orange-500/10 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400"
            >
              <Radio className="h-5 w-5 animate-pulse shrink-0" />
              <span className="truncate">Painel de Atendimento</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
