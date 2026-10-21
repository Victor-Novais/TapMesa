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
        "relative overflow-hidden rounded-3xl border border-emerald-300 bg-emerald-50/95 p-5 shadow-lg backdrop-blur transition-all duration-300 animate-in fade-in zoom-in-95 dark:border-emerald-800 dark:bg-emerald-950/80",
        className,
      )}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="absolute top-3.5 right-3.5 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 p-1"
        aria-label="Fechar mensagem de confirmação"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col items-center text-center space-y-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md animate-in zoom-in-50 duration-200">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-100">
          {UI_MESSAGES.calls.confirmedTitle}
        </h3>

        <p className="text-xs text-emerald-800 dark:text-emerald-200 max-w-xs">
          {UI_MESSAGES.calls.confirmedSubtitle}
        </p>

        {ratingLabel && (
          <span className="inline-flex items-center rounded-xl bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-sm dark:bg-emerald-900/60 dark:text-emerald-100">
            {ratingLabel}
          </span>
        )}
      </div>
    </div>
  );
}
