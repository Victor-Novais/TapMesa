"use client";

import * as React from "react";
import { CheckCircle2, X } from "lucide-react";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import type { PublicCallDto } from "@/shared/types/api";

export interface ConfirmedCallCardProps {
  call: PublicCallDto;
  onDismiss: () => void;
  className?: string;
}

export function ConfirmedCallCard({
  call,
  onDismiss,
  className,
}: ConfirmedCallCardProps) {
  React.useEffect(() => {
    // Transiciona de volta ao estado Livre após breve agradecimento (3.5 segundos)
    const timer = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onDismiss]);

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
          {UI_MESSAGES.calls.confirmedTitle}
        </h3>

        <p className="max-w-xs text-sm text-ink-2 text-pretty">
          {UI_MESSAGES.calls.confirmedSubtitle}
        </p>

        {ratingLabel && (
          <span className="inline-flex items-center rounded-full bg-success-tint px-3 py-1 text-xs font-semibold text-success">
            {ratingLabel}
          </span>
        )}
      </div>
    </div>
  );
}
