"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Menu, Radio } from "lucide-react";
import { Button, IconButton } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { queryKeys } from "@/shared/api/query-client";
import { getCurrentRestaurant } from "@/shared/api/restaurant";
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
    queryKey: queryKeys.restaurant.current,
    queryFn: getCurrentRestaurant,
    enabled: hasRestaurant,
    staleTime: 60_000,
  });

  const restaurantName =
    impersonation?.targetRestaurantName ||
    restaurant?.name ||
    (hasRestaurant ? "Carregando restaurante..." : "Administração Geral");

  return (
    <header className="sticky top-0 z-30 flex h-14 sm:h-16 w-full items-center justify-between border-b border-border bg-canvas px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <IconButton
          onClick={onOpenMobileMenu}
          className="lg:hidden"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </IconButton>

        <div className="flex items-center gap-2 min-w-0">
          <BrandLogo size={32} alt="" className="hidden sm:block lg:hidden" />
          <span className="truncate text-sm sm:text-base font-semibold text-ink">
            {restaurantName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="hidden xs:inline-flex"
        >
          <Link href="/panel">
            <Radio className="h-4 w-4 text-brand" aria-hidden />
            <span className="text-xs font-semibold">Painel</span>
          </Link>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
