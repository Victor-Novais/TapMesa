"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock } from "lucide-react";
import { AuthGate, useAuth, useAuthStore } from "@/features/auth";
import { UserMenu } from "@/app/_components/user-menu";
import { ConnectionIndicator } from "@/shared/ui/connection-indicator";
import { Button } from "@/shared/ui/button";
import { queryKeys } from "@/shared/api/query-client";
import { getCurrentRestaurant } from "@/shared/api/settings";
import { useNow } from "@/shared/lib/clock";
import { usePanelStore } from "@/features/panel";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role } = useAuth();
  const { impersonation } = useAuthStore();
  const connectionStatus = usePanelStore((s) => s.connectionStatus);
  const now = useNow();

  const hasRestaurant = Boolean(user?.restaurantId || user?.rid);

  const { data: restaurant } = useQuery({
    queryKey: queryKeys.settings.currentRestaurant,
    queryFn: getCurrentRestaurant,
    enabled: hasRestaurant,
    staleTime: 60_000,
  });

  const restaurantName =
    impersonation?.targetRestaurantName ||
    restaurant?.name ||
    (hasRestaurant ? "Restaurante" : "Salão");

  const formattedTime = new Date(now).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const canGoToDashboard = role === "OWNER" || role === "ADMIN";

  return (
    <AuthGate allowedRoles={["WAITER", "OWNER", "ADMIN"]}>
      <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        {/* Minimal Operational Chrome Header */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-zinc-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/95">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600" />
              </span>
              <span className="font-bold tracking-tight text-sm sm:text-base">
                {restaurantName}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-mono font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>{formattedTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <ConnectionIndicator status={connectionStatus} />

            {canGoToDashboard && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex text-xs font-semibold text-zinc-600 dark:text-zinc-400"
              >
                <Link href="/dashboard">
                  <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                  Dashboard
                </Link>
              </Button>
            )}

            <UserMenu />
          </div>
        </header>

        {/* Operational surface */}
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">{children}</main>
      </div>
    </AuthGate>
  );
}
