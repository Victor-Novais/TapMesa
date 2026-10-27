"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import { Radio } from "lucide-react";
import { BrandLogo } from "@/shared/ui/brand-logo";
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
        <div className="flex items-center gap-2.5 pb-4 border-b border-border-subtle">
          <BrandLogo size={36} alt="" />
          <span className="text-base font-bold text-ink">Aproxime Aí</span>
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
                  "flex min-h-11 items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                  isActive
                    ? "bg-nav font-semibold text-ink"
                    : "text-ink-2 hover:bg-nav hover:text-ink",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive ? "text-brand" : "text-ink-2",
                  )}
                />
                <div className="flex flex-col">
                  <span className="leading-snug">{item.label}</span>
                  <span className="text-xs font-normal text-ink-2">
                    {item.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom panel action */}
        <div className="border-t border-border-subtle pt-3">
          <Link
            href="/panel"
            onClick={() => onOpenChange(false)}
            className="flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-colors duration-150 ease-out-soft hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-raised"
          >
            <Radio className="h-4 w-4" aria-hidden />
            <span>Abrir Painel</span>
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
