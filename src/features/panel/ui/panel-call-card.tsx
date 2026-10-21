"use client";

import * as React from "react";
import {
  Bell,
  Receipt,
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { calculateElapsedSec, formatTimer } from "@/shared/lib/clock";
import { cn } from "@/shared/lib/cn";
import type { PanelCallDto } from "@/shared/types/api";

export interface PanelCallCardProps {
  call: PanelCallDto;
  thresholds: {
    alertSec: number;
    urgentSec: number;
  };
  onAssume: (id: string) => void;
  onAttend: (id: string) => void;
  isSubmitting?: boolean;
  currentUserId?: string;
  className?: string;
}

export function PanelCallCard({
  call,
  thresholds,
  onAssume,
  onAttend,
  isSubmitting = false,
  currentUserId,
  className,
}: PanelCallCardProps) {
  const elapsedSec = calculateElapsedSec(call.createdAt);
  const timerDisplay = formatTimer(elapsedSec);

  const isUrgent = elapsedSec >= thresholds.urgentSec;
  const isAlert = !isUrgent && elapsedSec >= thresholds.alertSec;

  const isAssumed = Boolean(call.acknowledgedAt);
  const isAssumedByMe = Boolean(
    isAssumed &&
    currentUserId &&
    call.acknowledgedById &&
    call.acknowledgedById === currentUserId,
  );
  const isBill = call.type === "BILL";

  const alertBadge = isUrgent ? (
    <Badge
      variant="danger"
      className="flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm animate-pulse"
    >
      <Flame className="h-4 w-4" />
      <span>Urgente</span>
    </Badge>
  ) : isAlert ? (
    <Badge
      variant="alert"
      className="flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-sm"
    >
      <AlertTriangle className="h-4 w-4" />
      <span>Alerta</span>
    </Badge>
  ) : (
    <Badge
      variant="success"
      className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm"
    >
      <Clock className="h-3.5 w-3.5" />
      <span>Normal</span>
    </Badge>
  );

  return (
    <article
      role="region"
      aria-label={`Mesa ${call.tableNumber}, chamado de ${isBill ? "Conta" : "Garçom"}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-5 lg:p-6 shadow-md transition-all duration-200 animate-in fade-in zoom-in-95 dark:bg-zinc-900 select-none",
        // Níveis visuais de alerta
        isUrgent
          ? "border-red-500/90 ring-4 ring-red-500/20 shadow-red-500/10 dark:border-red-500 dark:ring-red-950/60"
          : isAlert
            ? "border-amber-400/90 ring-2 ring-amber-400/20 shadow-amber-500/10 dark:border-amber-500 dark:ring-amber-950/40"
            : isBill
              ? "border-emerald-300/90 dark:border-emerald-700/80 hover:border-emerald-400"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
        className,
      )}
    >
      {/* Top Accent Strip */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1.5",
          isUrgent
            ? "bg-red-600 animate-pulse"
            : isAlert
              ? "bg-amber-500"
              : isBill
                ? "bg-emerald-500"
                : "bg-orange-500",
        )}
      />

      <div className="space-y-4">
        {/* Header: Table Number & Alert Level Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
              Mesa {call.tableNumber}
            </span>
          </div>
          {alertBadge}
        </div>

        {/* Call Type and Live Timer */}
        <div className="flex items-center justify-between rounded-2xl bg-zinc-50/80 p-3.5 border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            {isBill ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-base sm:text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Receipt className="h-5 w-5" />
                </div>
                <span>Pedir a Conta</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-black text-base sm:text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
                  <Bell className="h-5 w-5" />
                </div>
                <span>Chamar Garçom</span>
              </div>
            )}

            {call.reopenCount > 0 && (
              <Badge
                variant="alert"
                className="text-[11px] font-bold px-2 py-0.5 ml-1"
              >
                Reaberto ({call.reopenCount}x)
              </Badge>
            )}
          </div>

          {/* Wait Timer */}
          <div className="text-right">
            <div
              className={cn(
                "font-mono text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight",
                isUrgent
                  ? "text-red-600 dark:text-red-400"
                  : isAlert
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-zinc-900 dark:text-zinc-100",
              )}
              aria-label={`Tempo decorrido: ${timerDisplay}`}
            >
              {timerDisplay}
            </div>
            <p className="text-[10px] uppercase font-bold text-zinc-400">
              Espera
            </p>
          </div>
        </div>

        {/* Note if provided */}
        {call.note && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-zinc-100/70 p-3 text-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-700/60">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <p className="text-sm font-medium italic break-words leading-relaxed">
              &ldquo;{call.note}&rdquo;
            </p>
          </div>
        )}

        {/* Assumed status indicator */}
        {isAssumed && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isAssumedByMe
                ? "Assumido por você"
                : "Chamado assumido pela equipe"}
            </span>
          </div>
        )}
      </div>

      {/* Big Action Buttons (Min height 48px, readable and tactile) */}
      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-3">
        <Button
          type="button"
          size="lg"
          variant={isAssumed ? "secondary" : "outline"}
          disabled={isAssumed || isSubmitting}
          isLoading={isSubmitting && !isAssumed}
          onClick={() => onAssume(call.id)}
          className={cn(
            "h-12 min-h-[48px] text-sm sm:text-base font-bold shadow-sm transition-all",
            isAssumed && "opacity-75 cursor-default",
          )}
          aria-label={
            isAssumed
              ? "Chamado já assumido"
              : `Assumir mesa ${call.tableNumber}`
          }
        >
          {isAssumed ? (
            <>
              <UserCheck className="mr-1.5 h-4 w-4 text-emerald-600" />
              <span>Assumido</span>
            </>
          ) : (
            <span>Assumir</span>
          )}
        </Button>

        <Button
          type="button"
          size="lg"
          variant={isBill ? "success" : "primary"}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          onClick={() => onAttend(call.id)}
          className="h-12 min-h-[48px] text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all"
          aria-label={`Concluir atendimento da mesa ${call.tableNumber}`}
        >
          <span>Atendido</span>
        </Button>
      </div>
    </article>
  );
}
