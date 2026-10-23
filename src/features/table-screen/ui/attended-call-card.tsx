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
          "relative overflow-hidden rounded-3xl border border-amber-200/80 bg-white/95 p-5 shadow-xl backdrop-blur transition-[border-color,box-shadow,background-color] duration-150 ease-out animate-in fade-in zoom-in-95 dark:border-amber-900/60 dark:bg-zinc-900/95",
          className,
        )}
      >
        {/* Accent top ambient strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-emerald-500" />

        <div className="text-center space-y-1.5">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Check className="h-6 w-6 stroke-[2.5]" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {promptTitle}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
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
              "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              selectedRating === 1
                ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 shadow-sm"
                : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-red-300 hover:bg-red-50/50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-red-900",
            )}
            aria-label="Avaliar como ruim"
          >
            <Frown className="h-7 w-7 text-red-500 dark:text-red-400 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold">
              {UI_MESSAGES.calls.ratingBad}
            </span>
          </button>

          {/* Rating 2: Regular */}
          <button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => handleSelectRating(2)}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
              selectedRating === 2
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 shadow-sm"
                : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-amber-300 hover:bg-amber-50/50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-amber-900",
            )}
            aria-label="Avaliar como regular"
          >
            <Meh className="h-7 w-7 text-amber-500 dark:text-amber-400 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold">
              {UI_MESSAGES.calls.ratingRegular}
            </span>
          </button>

          {/* Rating 3: Excelente */}
          <button
            type="button"
            disabled={confirmMutation.isPending}
            onClick={() => handleSelectRating(3)}
            className={cn(
              "flex min-h-[64px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
              selectedRating === 3
                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 shadow-sm"
                : "border-zinc-200 bg-zinc-50/80 text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-emerald-900",
            )}
            aria-label="Avaliar como excelente"
          >
            <Smile className="h-7 w-7 text-emerald-500 dark:text-emerald-400 transition-transform group-hover:scale-110" />
            <span className="text-xs font-semibold">
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
            className="w-full font-bold shadow-sm"
          >
            <Check className="mr-2 h-4 w-4" />
            <span>{confirmButtonLabel}</span>
          </Button>
        </div>

        {/* Footer info: Countdown to deadline and Contest button */}
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          {remainingSec !== null && (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                {UI_MESSAGES.calls.autoConfirmPrefix}{" "}
                <strong className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                  {formatTimer(remainingSec)}
                </strong>
              </span>
            </div>
          )}

          {contestFlagged ? (
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              {UI_MESSAGES.calls.contestFinalNotice}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setShowContestDialog(true)}
              disabled={contestMutation.isPending || confirmMutation.isPending}
              className="min-h-[44px] inline-flex items-center text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-4 transition-colors px-2 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {contestButtonLabel}
            </button>
          )}
        </div>
        {actionError && (
          <p
            role="alert"
            className="mt-2 text-xs text-red-600 dark:text-red-400"
          >
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
