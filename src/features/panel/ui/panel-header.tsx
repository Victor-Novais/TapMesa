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
  Settings,
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
import { getCurrentRestaurant } from "@/shared/api/restaurant";
import type { PanelCounters } from "../model/panel-store";

export interface PanelHeaderProps {
  restaurantName?: string;
  connectionStatus: ConnectionStatus;
  counters: PanelCounters;
  recentCount: number;
  onOpenRecent: () => void;
  onOpenSettings?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => Promise<void> | void;
  userMenu?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  restaurantName,
  connectionStatus,
  counters,
  recentCount,
  onOpenRecent,
  onOpenSettings,
  isMuted: externalIsMuted,
  onToggleMute: externalOnToggleMute,
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen: externalOnToggleFullscreen,
  userMenu,
}: PanelHeaderProps) {
  const { user, role } = useAuth();
  const { impersonation } = useAuthStore();
  const now = useNow();

  const hasRestaurant = Boolean(user?.rid);

  const { data: restaurant } = useQuery({
    queryKey: queryKeys.restaurant.current,
    queryFn: getCurrentRestaurant,
    enabled: !restaurantName && hasRestaurant,
    staleTime: 60_000,
  });

  const resolvedRestaurantName =
    restaurantName ||
    impersonation?.targetRestaurantName ||
    restaurant?.name ||
    (hasRestaurant ? "Restaurante" : "Salão");

  const [localFullscreen, setLocalFullscreen] = React.useState(false);
  const [localMuted, setLocalMuted] = React.useState(false);

  const isFullscreen = externalIsFullscreen ?? localFullscreen;
  const isMuted = externalIsMuted ?? localMuted;

  // Formata o horário do relógio operacional oficial
  const formattedTime = new Date(now).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const canGoToDashboard = role === "OWNER" || role === "ADMIN";

  const handleToggleFullscreen = async () => {
    if (externalOnToggleFullscreen) {
      await externalOnToggleFullscreen();
      return;
    }
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setLocalFullscreen(true);
      } else {
        await document.exitFullscreen();
        setLocalFullscreen(false);
      }
    } catch {
      // Ignora erro se tela cheia for bloqueada pelo navegador
    }
  };

  const handleToggleMute = () => {
    if (externalOnToggleMute) {
      externalOnToggleMute();
    } else {
      setLocalMuted((prev) => !prev);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setLocalFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-surface px-4 py-2.5 sm:px-6 lg:px-8 3xl:py-4">
      <div className="mx-auto flex max-w-[3840px] flex-wrap items-center justify-between gap-3">
        {/* Left Section: Branding & Operational Clock */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-brand"
            />
            <span className="truncate text-[length:clamp(1rem,0.75vw+0.5rem,1.75rem)] font-bold tracking-tight text-ink">
              {resolvedRestaurantName}
            </span>
          </div>

          <div className="hidden items-center gap-1.5 rounded-control bg-nav px-3 py-1 text-[length:clamp(0.875rem,0.75vw+0.375rem,1.75rem)] font-semibold text-ink sm:flex">
            <Clock className="h-[1em] w-[1em] text-ink-2" aria-hidden />
            <span className="tabular-nums">{formattedTime}</span>
          </div>
        </div>

        {/* Center Section: Operational Counters */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Counter */}
          <div className="flex items-center gap-1.5 rounded-control bg-nav px-2.5 py-1 text-[length:clamp(0.875rem,0.75vw+0.375rem,1.5rem)] font-semibold text-ink">
            <span className="font-medium text-ink-2">Total:</span>
            <span className="font-bold tabular-nums">
              {counters.activeCallsCount}
            </span>
          </div>

          {/* Waiter Counter */}
          <div className="flex items-center gap-1.5 rounded-control bg-nav px-2.5 py-1 text-[length:clamp(0.875rem,0.75vw+0.375rem,1.5rem)] font-semibold text-ink">
            <Bell className="h-[1em] w-[1em] text-primary-ink" aria-hidden />
            <span className="hidden font-medium text-ink-2 md:inline">
              Garçom:
            </span>
            <span className="font-bold tabular-nums">
              {counters.waiterCallsCount}
            </span>
          </div>

          {/* Bill Counter */}
          <div className="flex items-center gap-1.5 rounded-control bg-nav px-2.5 py-1 text-[length:clamp(0.875rem,0.75vw+0.375rem,1.5rem)] font-semibold text-ink">
            <Receipt className="h-[1em] w-[1em] text-ink-2" aria-hidden />
            <span className="hidden font-medium text-ink-2 md:inline">
              Conta:
            </span>
            <span className="font-bold tabular-nums">
              {counters.billCallsCount}
            </span>
          </div>
        </div>

        {/* Right Section: Controls, Indicators, Shortcuts, and Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ConnectionIndicator status={connectionStatus} />

          {/* Sound Mute Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToggleMute}
            className="h-11 min-h-11 w-11 min-w-11 p-0 text-ink-2 hover:text-ink"
            aria-label={isMuted ? "Ativar som" : "Silenciar som"}
            title={isMuted ? "Ativar som" : "Silenciar som"}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-danger-ink" aria-hidden />
            ) : (
              <Volume2 className="h-5 w-5" aria-hidden />
            )}
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleToggleFullscreen()}
            className="hidden h-11 min-h-11 w-11 min-w-11 p-0 text-ink-2 hover:text-ink sm:inline-flex"
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" aria-hidden />
            ) : (
              <Maximize2 className="h-5 w-5" aria-hidden />
            )}
          </Button>

          {/* Settings Modal Button */}
          {onOpenSettings && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="h-11 min-h-11 w-11 min-w-11 p-0 text-ink-2 hover:text-ink"
              aria-label="Abrir configurações de som e tela do painel"
              title="Configurações do Painel"
            >
              <Settings className="h-5 w-5" aria-hidden />
            </Button>
          )}

          {/* Recent Drawer Button with Badge */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenRecent}
            className="h-11 min-h-11 gap-1.5 px-3 text-sm font-semibold"
            aria-label="Abrir gaveta de chamados recentes"
          >
            <History className="h-4 w-4 text-ink-2" aria-hidden />
            <span className="hidden sm:inline">Recentes</span>
            {recentCount > 0 && (
              <Badge
                variant="neutral"
                className="px-1.5 py-0 text-xs font-semibold tabular-nums"
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
              className="hidden text-sm font-medium text-ink-2 xl:inline-flex"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" aria-hidden />
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
