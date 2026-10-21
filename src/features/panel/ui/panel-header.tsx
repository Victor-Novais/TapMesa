"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Receipt,
  Clock,
  History,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  ConnectionIndicator,
  type ConnectionStatus,
} from "@/shared/ui/connection-indicator";
import { useNow } from "@/shared/lib/clock";
import { useAuth, useAuthStore } from "@/features/auth";
import { queryKeys } from "@/shared/api/query-client";
import { getCurrentRestaurant } from "@/shared/api/settings";
import type { PanelCounters } from "../model/panel-store";

export interface PanelHeaderProps {
  restaurantName?: string;
  connectionStatus: ConnectionStatus;
  counters: PanelCounters;
  recentCount: number;
  onOpenRecent: () => void;
  userMenu?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  restaurantName,
  connectionStatus,
  counters,
  recentCount,
  onOpenRecent,
  userMenu,
}: PanelHeaderProps) {
  const { user, role } = useAuth();
  const { impersonation } = useAuthStore();
  const now = useNow();

  const hasRestaurant = Boolean(user?.restaurantId || user?.rid);

  const { data: restaurant } = useQuery({
    queryKey: queryKeys.settings.currentRestaurant,
    queryFn: getCurrentRestaurant,
    enabled: !restaurantName && hasRestaurant,
    staleTime: 60_000,
  });

  const resolvedRestaurantName =
    restaurantName ||
    impersonation?.targetRestaurantName ||
    restaurant?.name ||
    (hasRestaurant ? "Restaurante" : "Salão");

  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);

  // Formata o horário do relógio operacional oficial
  const formattedTime = new Date(now).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const canGoToDashboard = role === "OWNER" || role === "ADMIN";

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignora erro se tela cheia for bloqueada pelo navegador
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 py-2.5 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/95 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-[1920px] mx-auto">
        {/* Left Section: Branding & Operational Clock */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-orange-600" />
            </span>
            <span className="truncate text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {resolvedRestaurantName}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-zinc-100/90 px-3 py-1 font-mono text-xs font-bold text-zinc-700 shadow-inner dark:bg-zinc-800/90 dark:text-zinc-200">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span className="tabular-nums">{formattedTime}</span>
          </div>
        </div>

        {/* Center Section: Operational Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Counter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-100 shadow-sm">
            <span className="text-zinc-500 font-medium">Total:</span>
            <span className="font-mono text-sm tabular-nums">
              {counters.activeCallsCount}
            </span>
          </div>

          {/* Waiter Counter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-orange-200/80 bg-orange-50/80 px-2.5 py-1 text-xs font-bold text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200 shadow-sm">
            <Bell className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <span className="hidden md:inline font-medium">Garçom:</span>
            <span className="font-mono text-sm tabular-nums">
              {counters.waiterCallsCount}
            </span>
          </div>

          {/* Bill Counter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-xs font-bold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200 shadow-sm">
            <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden md:inline font-medium">Conta:</span>
            <span className="font-mono text-sm tabular-nums">
              {counters.billCallsCount}
            </span>
          </div>
        </div>

        {/* Right Section: Controls, Indicators, Shortcuts, and Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ConnectionIndicator status={connectionStatus} />

          {/* Sound Toggle (Preparatório F11) */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsMuted((prev) => !prev)}
            className="h-9 w-9 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label={isMuted ? "Ativar som" : "Silenciar som"}
            title={isMuted ? "Ativar som" : "Silenciar som"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-red-500" />
            ) : (
              <Volume2 className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            )}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleFullscreen}
            className="hidden sm:inline-flex h-9 w-9 p-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>

          {/* Recent Drawer Button with Badge */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenRecent}
            className="h-9 text-xs font-bold gap-1.5 border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            aria-label="Abrir gaveta de chamados recentes"
          >
            <History className="h-4 w-4 text-zinc-500" />
            <span className="hidden sm:inline">Recentes</span>
            {recentCount > 0 && (
              <Badge
                variant="neutral"
                className="px-1.5 py-0 text-[10px] font-mono font-bold bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {recentCount}
              </Badge>
            )}
          </Button>

          {/* Dashboard link for owners/admins */}
          {canGoToDashboard && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden xl:inline-flex text-xs font-semibold text-zinc-600 dark:text-zinc-400"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Dashboard
              </Link>
            </Button>
          )}

          {userMenu}
        </div>
      </div>
    </header>
  );
}
