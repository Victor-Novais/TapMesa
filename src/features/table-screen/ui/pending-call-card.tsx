"use client";

import * as React from "react";
import { Bell, Receipt, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useNow, calculateElapsedSec, formatTimer } from "@/shared/lib/clock";
import { useCancelCallMutation } from "../api/use-table-mutations";
import { parseApiError } from "@/shared/api/problem-details";
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
    ? UI_MESSAGES.calls.waiterCalled
    : UI_MESSAGES.calls.billRequested;

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
          // Borda superior de 3px na cor do estado (pendente = marca); sem gradiente nem pulso
          "relative overflow-hidden rounded-sheet border border-border border-t-[3px] border-t-brand bg-surface p-5 text-ink shadow-elevation-1 animate-in fade-in-0 zoom-in-95 duration-200 ease-out-soft",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-brand-tint text-primary-ink">
              {isWaiter ? (
                <Bell className="h-6 w-6" aria-hidden />
              ) : (
                <Receipt className="h-6 w-6" aria-hidden />
              )}
            </div>

            <div className="min-w-0 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold leading-tight text-ink">
                  {title}
                </h3>
                {call.reopenCount > 0 && (
                  <Badge variant="alert" size="sm">
                    {UI_MESSAGES.calls.reopenedBadge} ({call.reopenCount}x)
                  </Badge>
                )}
              </div>
              <p className="text-sm text-ink-2">
                {formattedTime
                  ? `Pedido feito às ${formattedTime}`
                  : "Solicitação em andamento"}
              </p>
            </div>
          </div>
        </div>

        {/* Subtitle / Explanation */}
        <p className="mt-3 text-left text-sm leading-relaxed text-ink-2 text-pretty">
          {pendingSubtitle}
        </p>

        {/* Note if provided */}
        {call.note && (
          <div className="mt-3 flex items-start gap-2 rounded-control bg-nav p-3 text-left">
            <MessageSquare
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-2"
              aria-hidden
            />
            <p className="break-words text-sm font-medium italic text-ink">
              &ldquo;{call.note}&rdquo;
            </p>
          </div>
        )}

        {/* Live Wait Timer (if restaurant has showWaitTimeToCustomer enabled) */}
        {showWaitTimeToCustomer && (
          <div className="mt-4 flex items-center justify-between rounded-control bg-nav px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ink-2" aria-hidden />
              <span className="text-sm font-medium text-ink-2">
                Tempo de espera:
              </span>
            </div>
            <span
              className="text-xl font-semibold tabular-nums text-ink"
              aria-label={`Tempo decorrido: ${formattedElapsed}`}
            >
              {formattedElapsed}
            </span>
          </div>
        )}

        {/* Cancel Action */}
        <div className="mt-4 flex justify-end border-t border-border-subtle pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowCancelDialog(true)}
            isLoading={cancelMutation.isPending}
            className="text-sm font-medium hover:bg-danger-tint hover:text-danger-ink"
          >
            {cancelLabel}
          </Button>
        </div>
        {cancelMutation.error && (
          <p role="alert" className="mt-2 text-sm text-danger-ink">
            {parseApiError(cancelMutation.error).detail}
          </p>
        )}
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
