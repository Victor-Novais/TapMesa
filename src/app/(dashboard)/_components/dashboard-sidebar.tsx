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
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { IconButton } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
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
          // Fixa na altura da janela: o fundo da navegação cobre a lateral inteira
          "sticky top-0 hidden h-dvh flex-col overflow-y-auto bg-nav transition-[width] duration-200 ease-out-soft lg:flex",
          isCollapsed ? "w-18" : "w-62",
          className,
        )}
      >
        {/* Logo / Brand Header */}
        <div
          className={cn(
            "flex h-16 items-center px-3",
            isCollapsed ? "justify-center" : "justify-between",
          )}
        >
          <Link
            href="/dashboard"
            aria-label={isCollapsed ? "Aproxime Aí" : undefined}
            className="flex items-center gap-2.5 overflow-hidden rounded-control font-bold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-nav"
          >
            <BrandLogo size={36} alt="" priority />
            {!isCollapsed && (
              <span className="truncate text-base font-bold tracking-tight">
                Aproxime Aí
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <IconButton
              onClick={onToggleCollapse}
              aria-label="Recolher barra lateral"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </IconButton>
          )}
        </div>

        {/* Recolhida: o botão de expandir fica abaixo do logo (não cabe ao lado) */}
        {isCollapsed && (
          <div className="flex justify-center pb-1">
            <IconButton
              onClick={onToggleCollapse}
              aria-label="Expandir barra lateral"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
        )}

        {/* Main Navigation */}
        <nav
          className="flex-1 space-y-1 px-3 py-2"
          aria-label="Navegação do sistema"
        >
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            const buttonContent = (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                className={cn(
                  "group flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-medium transition-colors duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-nav",
                  isActive
                    ? "bg-surface font-semibold text-ink shadow-elevation-1"
                    : "text-ink-2 hover:bg-surface/60 hover:text-ink",
                  isCollapsed && "justify-center px-0",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "h-4.5 w-4.5 shrink-0",
                    isActive ? "text-brand" : "text-ink-2 group-hover:text-ink",
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
        <div className="p-3">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/panel"
                  aria-label="Painel de Atendimento"
                  className="flex min-h-11 w-full items-center justify-center rounded-control border border-border-control bg-surface text-brand transition-colors duration-150 ease-out-soft hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-nav"
                >
                  <Radio className="h-5 w-5" aria-hidden />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                Painel de Atendimento
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              href="/panel"
              className="flex min-h-11 items-center gap-3 rounded-control border border-border-control bg-surface px-3 text-sm font-semibold text-ink transition-colors duration-150 ease-out-soft hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-nav"
            >
              <Radio className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span className="truncate">Painel de Atendimento</span>
            </Link>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}
