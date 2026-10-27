"use client";

import * as React from "react";
import { CheckCircle2, ExternalLink, X } from "lucide-react";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import {
  CONFIRMED_AUTO_DISMISS_MS,
  shouldAutoDismissConfirmed,
  type ConfirmedCardVariant,
} from "../lib/call-state";
import type { PublicCallDto } from "@/shared/types/api";

export interface ConfirmedCallCardProps {
  call: PublicCallDto;
  onDismiss: () => void;
  // "bill" = conta paga (confirmada pela equipe)
  variant?: ConfirmedCardVariant;
  googleReviewUrl?: string | null;
  className?: string;
}

export function ConfirmedCallCard({
  call,
  onDismiss,
  variant = "waiter",
  googleReviewUrl,
  className,
}: ConfirmedCallCardProps) {
  const isBill = variant === "bill";
  // O botão aparece para todo cliente que pagou: nunca condicionar à avaliação
  // rápida (o Google proíbe pedir avaliação só a clientes satisfeitos)
  const reviewUrl = isBill ? googleReviewUrl : null;
  const autoDismiss = shouldAutoDismissConfirmed(variant, googleReviewUrl);

  React.useEffect(() => {
    if (!autoDismiss) return;
    // Transiciona de volta ao estado Livre após breve agradecimento (3.5 segundos)
    const timer = setTimeout(() => {
      onDismiss();
    }, CONFIRMED_AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [onDismiss, autoDismiss]);

  const ratingLabel =
    call.rating === 1
      ? "Avaliado como: Ruim 🙁"
      : call.rating === 2
        ? "Avaliado como: Regular 😐"
        : call.rating === 3
          ? "Avaliado como: Excelente 😊"
          : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-sheet border border-border border-t-[3px] border-t-success bg-surface p-5 text-ink shadow-elevation-1 animate-in fade-in-0 zoom-in-95 duration-200 ease-out-soft",
        className,
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-nav hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        aria-label="Fechar mensagem de confirmação"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>

      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-control bg-success-tint text-success motion-safe:animate-in motion-safe:zoom-in-50 duration-200 ease-out-soft">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>

        <h3 className="text-lg font-semibold text-ink text-balance">
          {isBill
            ? UI_MESSAGES.calls.billPaidTitle
            : UI_MESSAGES.calls.confirmedTitle}
        </h3>

        <p className="max-w-xs text-sm text-ink-2 text-pretty">
          {isBill
            ? UI_MESSAGES.calls.billPaidSubtitle
            : UI_MESSAGES.calls.confirmedSubtitle}
        </p>

        {ratingLabel && (
          <span className="inline-flex items-center rounded-full bg-success-tint px-3 py-1 text-xs font-semibold text-success">
            {ratingLabel}
          </span>
        )}

        {reviewUrl && (
          <div className="w-full space-y-3 pt-2">
            <p className="text-sm text-ink-2 text-pretty">
              {UI_MESSAGES.calls.googleReviewPrompt}
            </p>
            {/* Nova aba: o cliente não perde a tela da mesa */}
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-control border-2 border-[var(--table-primary-border)] bg-[var(--table-primary)] px-4 py-2.5 text-base font-semibold text-[var(--table-primary-text)] transition hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span>{UI_MESSAGES.calls.googleReviewButton}</span>
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
