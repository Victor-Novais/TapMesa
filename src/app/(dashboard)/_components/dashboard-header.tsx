"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Menu, Radio, UtensilsCrossed } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-client";
import { getCurrentRestaurant } from "@/shared/api/settings";
import { useAuth, useAuthStore } from "@/features/auth";
import { UserMenu } from "@/app/_components/user-menu";

interface DashboardHeaderProps {
  onOpenMobileMenu?: () => void;
}

export function DashboardHeader({ onOpenMobileMenu }: DashboardHeaderProps) {
  const { user } = useAuth();
  const { impersonation } = useAuthStore();

  const hasRestaurant = Boolean(user?.rid);

  const { data: restaurant } = useQuery({
    queryKey: queryKeys.settings.currentRestaurant,
    queryFn: getCurrentRestaurant,
    enabled: hasRestaurant,
    staleTime: 60_000,
  });

  const restaurantName =
    impersonation?.targetRestaurantName ||
    restaurant?.name ||
    (hasRestaurant ? "Carregando restaurante..." : "Administração Geral");

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-zinc-200 bg-white/90 px-3 sm:px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenMobileMenu}
          className="h-10 w-10 min-h-[44px] min-w-[44px] p-0 lg:hidden text-zinc-600 dark:text-zinc-400"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white">
            <UtensilsCrossed className="h-4 w-4" />
          </div>
          <span className="truncate text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {restaurantName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden xs:inline-flex h-8 sm:h-9 border-orange-500/20 bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-400"
        >
          <Link href="/panel">
            <Radio className="mr-1.5 h-3.5 w-3.5 animate-pulse text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-semibold">Painel</span>
          </Link>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
