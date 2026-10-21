"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import { UtensilsCrossed, Radio } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { DASHBOARD_NAV_ITEMS } from "./dashboard-sidebar";

interface DashboardMobileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardMobileDrawer({
  open,
  onOpenChange,
}: DashboardMobileDrawerProps) {
  const pathname = usePathname();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent position="left" className="flex flex-col p-4 w-[280px]">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm shadow-orange-600/30">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            TapMesa
          </span>
        </div>

        {/* Links */}
        <nav className="flex-1 space-y-1 py-4">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-zinc-500 dark:text-zinc-400",
                  )}
                />
                <div className="flex flex-col">
                  <span className="leading-snug">{item.label}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom panel action */}
        <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <Link
            href="/panel"
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 transition-colors"
          >
            <Radio className="h-4 w-4 animate-pulse" />
            <span>Abrir Painel</span>
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
