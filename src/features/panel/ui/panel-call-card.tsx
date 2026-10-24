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

  // Nível por ícone + palavra (legível sem cor); cheio no alerta/urgência, neutro no normal.
  // Tamanho fluido para leitura a distância na TV (DESIGN_PLAN §2.5).
  const levelClass =
    "flex items-center gap-1.5 rounded-chip px-2.5 py-1 font-semibold uppercase tracking-wide text-[length:clamp(0.875rem,0.6vw+0.5rem,1.5rem)]";
  const alertBadge = isUrgent ? (
    <Badge
      variant="danger"
      className={cn(levelClass, "bg-danger text-on-danger")}
    >
      <Flame className="h-[1.1em] w-[1.1em]" aria-hidden />
      <span>Urgente</span>
    </Badge>
  ) : isAlert ? (
    <Badge
      variant="alert"
      className={cn(levelClass, "bg-warning text-on-warning")}
    >
      <AlertTriangle className="h-[1.1em] w-[1.1em]" aria-hidden />
      <span>Alerta</span>
    </Badge>
  ) : (
    <Badge variant="neutral" className={levelClass}>
      <Clock className="h-[1.1em] w-[1.1em]" aria-hidden />
      <span>Normal</span>
    </Badge>
  );

  return (
    <article
      role="region"
      aria-label={`Mesa ${call.tableNumber}, chamado de ${isBill ? "Conta" : "Garçom"}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-sheet bg-surface p-4 text-ink shadow-elevation-1 select-none sm:p-5 lg:p-6",
        "transition-[border-color,box-shadow] duration-200 ease-out-soft animate-in fade-in-0 zoom-in-95",
        // Nível na borda (1px neutro → 2px alerta → 3px urgente); o fundo continua surface
        isUrgent
          ? "border-[3px] border-danger"
          : isAlert
            ? "border-2 border-warning"
            : "border border-border",
        className,
      )}
    >
      {/* Faixa superior de 6px na cor do nível (sem pulso) */}
      <div
        aria-hidden
        className={cn(
          "absolute top-0 right-0 left-0 h-1.5",
          isUrgent
            ? "bg-danger"
            : isAlert
              ? "bg-warning"
              : isBill
                ? "bg-espresso dark:bg-ink-3"
                : "bg-brand",
        )}
      />

      <div className="space-y-4">
        {/* Header: Table Number & Alert Level Badge */}
        <div className="flex items-center justify-between gap-3">
          <span className="min-w-0 text-[length:clamp(2rem,2.2vw+1rem,4.5rem)] leading-none font-bold tracking-tight whitespace-nowrap text-ink">
            Mesa {call.tableNumber}
          </span>
          {alertBadge}
        </div>

        {/* Call Type and Live Timer */}
        <div className="flex items-center justify-between gap-3 rounded-card bg-nav p-3 sm:p-3.5">
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <div className="flex min-w-0 items-center gap-2 text-[length:clamp(1rem,0.5vw+0.75rem,1.5rem)] font-semibold text-ink">
              {isBill ? (
                <Receipt className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden />
              ) : (
                <Bell
                  className="h-[1.2em] w-[1.2em] shrink-0 text-primary-ink"
                  aria-hidden
                />
              )}
              <span className="text-balance">
                {isBill ? "Pedir a Conta" : "Chamar Garçom"}
              </span>
            </div>

            {call.reopenCount > 0 && (
              <Badge variant="alert" size="sm">
                Reaberto ({call.reopenCount}x)
              </Badge>
            )}
          </div>

          {/* Wait Timer: nunca encolhe */}
          <div className="shrink-0 text-right">
            <div
              className={cn(
                "text-[length:clamp(1.75rem,2vw+1rem,4rem)] leading-none font-bold tracking-tight tabular-nums",
                isUrgent
                  ? "text-danger-ink"
                  : isAlert
                    ? "text-warning-ink"
                    : "text-ink",
              )}
              aria-label={`Tempo decorrido: ${timerDisplay}`}
            >
              {timerDisplay}
            </div>
            <p className="mt-1 text-[length:clamp(0.75rem,0.4vw+0.5rem,1.125rem)] font-semibold tracking-wide text-ink-2 uppercase">
              Espera
            </p>
          </div>
        </div>

        {/* Note if provided */}
        {call.note && (
          <div className="flex items-start gap-2.5 rounded-card border border-border-subtle bg-canvas p-3 text-ink">
            <MessageSquare
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-2"
              aria-hidden
            />
            <p className="text-sm leading-relaxed font-medium break-words italic lg:text-base">
              &ldquo;{call.note}&rdquo;
            </p>
          </div>
        )}

        {/* Assumed status indicator */}
        {isAssumed && (
          <div className="flex items-center gap-2 rounded-control bg-success-tint px-3 py-2 text-sm font-semibold text-success">
            <UserCheck className="h-4 w-4" aria-hidden />
            <span>
              {isAssumedByMe
                ? "Assumido por você"
                : "Chamado assumido pela equipe"}
            </span>
          </div>
        )}
      </div>

      {/* Ações: 56px (64px na TV) */}
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-subtle pt-4">
        <Button
          type="button"
          size="lg"
          variant={isAssumed ? "secondary" : "outline"}
          disabled={isAssumed || isSubmitting}
          isLoading={isSubmitting && !isAssumed}
          onClick={() => onAssume(call.id)}
          className={cn(
            "h-14 text-base 3xl:h-16 3xl:text-lg",
            isAssumed && "cursor-default",
          )}
          aria-label={
            isAssumed
              ? "Chamado já assumido"
              : `Assumir mesa ${call.tableNumber}`
          }
        >
          {isAssumed ? (
            <>
              <UserCheck className="h-4 w-4" aria-hidden />
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
          className="h-14 text-base 3xl:h-16 3xl:text-lg"
          aria-label={`Concluir atendimento da mesa ${call.tableNumber}`}
        >
          <span>Atendido</span>
        </Button>
      </div>
    </article>
  );
}
