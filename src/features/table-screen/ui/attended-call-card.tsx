"use client";

import * as React from "react";
import { Check, Clock, Frown, Meh, Smile } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import {
  useConfirmCallMutation,
  useContestCallMutation,
} from "../api/use-table-mutations";
import { useNow, getServerNowMs, formatTimer } from "@/shared/lib/clock";
import { parseApiError } from "@/shared/api/problem-details";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import type { PublicCallDto, QuickRating } from "@/shared/types/api";

export interface AttendedCallCardProps {
  call: PublicCallDto;
  token: string;
  texts?: Record<string, string>;
  className?: string;
}

const MAX_REOPEN_COUNT = 2;

export function AttendedCallCard({
  call,
  token,
  texts = {},
  className,
}: AttendedCallCardProps) {
  const [showContestDialog, setShowContestDialog] = React.useState(false);
  const [selectedRating, setSelectedRating] =
    React.useState<QuickRating | null>(null);

  const confirmMutation = useConfirmCallMutation(token);
  const contestMutation = useContestCallMutation(token);
  // Ex.: 429 do limite de POSTs públicos; a atualização otimista já foi desfeita
  const actionError = confirmMutation.error ?? contestMutation.error;

  // Assina o tick do relógio global para atualizar o cronômetro do deadline
  useNow();

  const isWaiter = call.type === "WAITER";
  const promptTitle = texts.attendedPrompt || UI_MESSAGES.calls.attendedPrompt;
  const promptSubtitle = isWaiter
    ? UI_MESSAGES.calls.attendedSubtitle
    : "A equipe informou a entrega da conta. Como foi o atendimento?";
  const confirmButtonLabel =
    texts.confirmButton || UI_MESSAGES.calls.confirmSimple;
  const contestButtonLabel =
    texts.contestButton || UI_MESSAGES.calls.contestButton;

  // Calcula tempo restante até o deadline de confirmação automática
  const remainingSec = React.useMemo(() => {
    if (!call.confirmationDeadline) return null;
    try {
      const deadlineMs = new Date(call.confirmationDeadline).getTime();
      if (Number.isNaN(deadlineMs)) return null;
      const currentMs = getServerNowMs();
      return Math.max(0, Math.floor((deadlineMs - currentMs) / 1000));
    } catch {
      return null;
    }
  }, [call.confirmationDeadline]);

  // Máximo de 2 reaberturas: a 3ª contestação não reabre o chamado, só o
  // marca como contestado no painel (o chamado continua ATTENDED)
  const reachedReopenLimit = call.reopenCount >= MAX_REOPEN_COUNT;
  const [contestFlagged, setContestFlagged] = React.useState(false);

  const handleSelectRating = (rating: QuickRating) => {
    setSelectedRating(rating);
    confirmMutation.mutate({ callId: call.id, rating });
  };

  const handleSimpleConfirm = () => {
    confirmMutation.mutate({ callId: call.id });
  };

  const handleConfirmContest = () => {
    contestMutation.mutate(call.id, {
      onSuccess: (updated) => {
        if (updated.status === "ATTENDED") setContestFlagged(true);
      },
      onSettled: () => {
        setShowContestDialog(false);
      },
    });
  };

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "relative overflow-hidden rounded-sheet border border-border border-t-[3px] border-t-warning bg-surface p-5 text-ink shadow-elevation-1 animate-in fade-in-0 zoom-in-95 duration-200 ease-out-soft",
          className,
        )}
      >
        {/* Accent top ambient strip */}

        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-control bg-warning-tint text-warning-ink">
            <Check className="h-6 w-6 stroke-[2.5]" aria-hidden />
          </div>
          <h3 className="text-xl font-semibold text-ink text-balance">
            {promptTitle}
          </h3>
          <p className="mx-auto max-w-xs text-sm text-ink-2 text-pretty">
            {promptSubtitle}
          </p>
        </div>

        {/* 3 Smiley Rating Buttons */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {/* Rating 1: Ruim */}
          <button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => handleSelectRating(1)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-card border p-3 transition-[border-color,background-color,transform] duration-150 ease-out-soft active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              selectedRating === 1
                ? "border-2 border-danger bg-danger-tint text-danger-ink"
                : "border-border bg-canvas text-ink hover:border-border-control",
            )}
            aria-label="Avaliar como ruim"
          >
            <Frown className="h-7 w-7 text-danger" aria-hidden />
            <span className="text-sm font-semibold">
              {UI_MESSAGES.calls.ratingBad}
            </span>
          </button>

          {/* Rating 2: Regular */}
          <button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => handleSelectRating(2)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-card border p-3 transition-[border-color,background-color,transform] duration-150 ease-out-soft active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              selectedRating === 2
                ? "border-2 border-warning bg-warning-tint text-warning-ink"
                : "border-border bg-canvas text-ink hover:border-border-control",
            )}
            aria-label="Avaliar como regular"
          >
            <Meh className="h-7 w-7 text-warning-ink" aria-hidden />
            <span className="text-sm font-semibold">
              {UI_MESSAGES.calls.ratingRegular}
            </span>
          </button>

          {/* Rating 3: Excelente */}
          <button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => handleSelectRating(3)}
            className={cn(
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-card border p-3 transition-[border-color,background-color,transform] duration-150 ease-out-soft active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              selectedRating === 3
                ? "border-2 border-success bg-success-tint text-success"
                : "border-border bg-canvas text-ink hover:border-border-control",
            )}
            aria-label="Avaliar como excelente"
          >
            <Smile className="h-7 w-7 text-success" aria-hidden />
            <span className="text-sm font-semibold">
              {UI_MESSAGES.calls.ratingGood}
            </span>
          </button>
        </div>

        {/* Simple Confirm Button */}
        <div className="mt-3">
          <Button
            type="button"
            size="md"
            variant="primary"
            onClick={handleSimpleConfirm}
            isLoading={confirmMutation.isPending && selectedRating === null}
            disabled={confirmMutation.isPending}
            className="w-full"
          >
            <Check className="h-4 w-4" aria-hidden />
            <span>{confirmButtonLabel}</span>
          </Button>
        </div>

        {/* Footer info: Countdown to deadline and Contest button */}
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-border-subtle pt-3 sm:flex-row">
          {remainingSec !== null && (
            <div className="flex items-center gap-1.5 text-sm text-ink-2">
              <Clock className="h-4 w-4" aria-hidden />
              <span>
                {UI_MESSAGES.calls.autoConfirmPrefix}{" "}
                <strong className="font-semibold tabular-nums text-ink">
                  {formatTimer(remainingSec)}
                </strong>
              </span>
            </div>
          )}

          {contestFlagged ? (
            <span className="text-sm font-semibold text-ink-2">
              {UI_MESSAGES.calls.contestFinalNotice}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowContestDialog(true)}
              disabled={contestMutation.isPending || confirmMutation.isPending}
              className="inline-flex min-h-11 items-center rounded-control px-2 py-1 text-sm font-semibold text-danger-ink underline underline-offset-4 transition-colors hover:bg-danger-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {contestButtonLabel}
            </button>
          )}
        </div>
        {actionError && (
          <p role="alert" className="mt-2 text-sm text-danger-ink">
            {parseApiError(actionError).detail}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={showContestDialog}
        onOpenChange={setShowContestDialog}
        title={UI_MESSAGES.calls.contestConfirmTitle}
        description={
          reachedReopenLimit
            ? UI_MESSAGES.calls.contestFinalDesc
            : UI_MESSAGES.calls.contestConfirmDesc
        }
        confirmLabel="Sim, contestar"
        cancelLabel={UI_MESSAGES.calls.keepCall}
        variant="danger"
        isLoading={contestMutation.isPending}
        onConfirm={handleConfirmContest}
      />
    </>
  );
}
