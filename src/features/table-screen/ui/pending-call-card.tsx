"use client";

import * as React from "react";
import { Bell, Receipt, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useNow, calculateElapsedSec, formatTimer } from "@/shared/lib/clock";
import { useCancelCallMutation } from "../api/use-table-mutations";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import type { PublicCallDto } from "@/shared/types/api";

export interface PendingCallCardProps {
  call: PublicCallDto;
  token: string;
  showWaitTimeToCustomer?: boolean;
  texts?: Record<string, string>;
  className?: string;
}

function formatCallTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}

export function PendingCallCard({
  call,
  token,
  showWaitTimeToCustomer = false,
  texts = {},
  className,
}: PendingCallCardProps) {
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const cancelMutation = useCancelCallMutation(token);
  // Assina o tick compartilhado global de 1 segundo para atualizar o cronômetro
  useNow();

  const isWaiter = call.type === "WAITER";
  const title = isWaiter
    ? texts.waiterCalled || UI_MESSAGES.calls.waiterCalled
    : texts.billRequested || UI_MESSAGES.calls.billRequested;

  const cancelLabel = texts.cancelButton || UI_MESSAGES.calls.cancelCall;
  const pendingSubtitle =
    texts.pendingMessage ||
    (isWaiter
      ? "Um garçom foi notificado e já está a caminho."
      : "A equipe foi notificada e já está preparando sua conta.");

  const formattedTime = formatCallTime(call.createdAt);
  const elapsedSec = calculateElapsedSec(call.createdAt);
  const formattedElapsed = formatTimer(elapsedSec);

  const handleConfirmCancel = () => {
    cancelMutation.mutate(call.id, {
      onSettled: () => {
        setShowCancelDialog(false);
      },
    });
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "relative overflow-hidden rounded-3xl border border-black/10 bg-white/90 p-5 shadow-lg backdrop-blur transition-all duration-200 animate-in fade-in zoom-in-95 dark:border-white/10 dark:bg-zinc-900/90",
          className,
        )}
      >
        {/* Accent top ambient strip */}
        <div
          className={cn(
            "absolute top-0 left-0 right-0 h-1.5",
            isWaiter
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-emerald-500 to-teal-500",
          )}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                isWaiter
                  ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
                  : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
              )}
            >
              {isWaiter ? (
                <Bell className="h-6 w-6 animate-pulse" />
              ) : (
                <Receipt className="h-6 w-6" />
              )}
              {/* Pulsing online ping */}
              <span className={cn("absolute -top-1 -right-1 flex h-3 w-3")}>
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    isWaiter ? "bg-orange-400" : "bg-emerald-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-3 w-3 rounded-full",
                    isWaiter ? "bg-orange-500" : "bg-emerald-500",
                  )}
                />
              </span>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {title}
                </h3>
                {call.reopenCount > 0 && (
                  <Badge variant="alert" className="text-[10px] px-1.5 py-0.5">
                    {UI_MESSAGES.calls.reopenedBadge} ({call.reopenCount}x)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formattedTime
                  ? `Pedido feito às ${formattedTime}`
                  : "Solicitação em andamento"}
              </p>
            </div>
          </div>
        </div>

        {/* Subtitle / Explanation */}
        <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 text-left">
          {pendingSubtitle}
        </p>

        {/* Note if provided */}
        {call.note && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-zinc-100/80 p-3 text-left dark:bg-zinc-800/80">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
            <p className="text-xs font-medium italic text-zinc-700 dark:text-zinc-300 break-words">
              &ldquo;{call.note}&rdquo;
            </p>
          </div>
        )}

        {/* Live Wait Timer (if restaurant has showWaitTimeToCustomer enabled) */}
        {showWaitTimeToCustomer && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400 animate-spin-slow" />
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Tempo de espera:
              </span>
            </div>
            <span
              className="font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100"
              aria-label={`Tempo decorrido: ${formattedElapsed}`}
            >
              {formattedElapsed}
            </span>
          </div>
        )}

        {/* Cancel Action */}
        <div className="mt-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
            isLoading={cancelMutation.isPending}
            className="text-xs font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title={UI_MESSAGES.calls.cancelConfirmTitle}
        description={UI_MESSAGES.calls.cancelConfirmDesc}
        confirmLabel={UI_MESSAGES.calls.confirmCancel}
        cancelLabel={UI_MESSAGES.calls.keepCall}
        variant="danger"
        isLoading={cancelMutation.isPending}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
