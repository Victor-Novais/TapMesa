"use client";

import * as React from "react";
import { Bell, Receipt, MessageSquare, AlertCircle, X } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { PendingCallCard } from "./pending-call-card";
import { useOpenCallMutation } from "../api/use-table-mutations";
import { parseApiError } from "@/shared/api/problem-details";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import type { PublicCallDto, CallType } from "@/shared/types/api";

export interface CallActionsProps {
  token: string;
  calls: PublicCallDto[];
  available?: boolean;
  showWaitTimeToCustomer?: boolean;
  texts?: Record<string, string>;
  className?: string;
}

export function CallActions({
  token,
  calls,
  available = true,
  showWaitTimeToCustomer = false,
  texts = {},
  className,
}: CallActionsProps) {
  const [note, setNote] = React.useState("");
  const [showNoteField, setShowNoteField] = React.useState(false);
  const [activeSubmittingType, setActiveSubmittingType] =
    React.useState<CallType | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const openCallMutation = useOpenCallMutation(token);

  // Check coexisting pending calls
  const pendingWaiter = calls.find(
    (c) => c.type === "WAITER" && c.status === "PENDING",
  );
  const pendingBill = calls.find(
    (c) => c.type === "BILL" && c.status === "PENDING",
  );

  const hasAnyFreeType = !pendingWaiter || !pendingBill;

  const waiterButtonText =
    texts.callWaiterButton ||
    texts.waiterButton ||
    UI_MESSAGES.calls.callWaiter;

  const billButtonText =
    texts.requestBillButton ||
    texts.billButton ||
    UI_MESSAGES.calls.requestBill;

  const notePlaceholder =
    texts.notePlaceholder || UI_MESSAGES.calls.notePlaceholder;

  const handleOpenCall = (type: CallType) => {
    if (!available || openCallMutation.isPending) return;

    setActiveSubmittingType(type);
    setErrorMessage(null);

    const callNote = note.trim() ? note.trim().slice(0, 140) : undefined;

    openCallMutation.mutate(
      { type, note: callNote },
      {
        onSuccess: () => {
          setNote("");
          setShowNoteField(false);
          setActiveSubmittingType(null);
        },
        onError: (err) => {
          setActiveSubmittingType(null);
          const problem = parseApiError(err);
          if (problem.code === "TABLE_PAUSED") {
            setErrorMessage("O atendimento nesta mesa foi pausado no momento.");
          } else if (problem.status === 429) {
            setErrorMessage(
              "Muitas solicitações seguidas. Aguarde alguns instantes antes de tentar de novo.",
            );
          } else {
            setErrorMessage(
              problem.detail || UI_MESSAGES.common.errorDescription,
            );
          }
        },
      },
    );
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Error alert banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-left shadow-sm backdrop-blur dark:border-red-900/60 dark:bg-red-950/80 animate-in fade-in"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-600 hover:text-red-800 dark:text-red-400"
            aria-label="Fechar aviso de erro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Pending Waiter Card */}
      {pendingWaiter && (
        <PendingCallCard
          call={pendingWaiter}
          token={token}
          showWaitTimeToCustomer={showWaitTimeToCustomer}
          texts={texts}
        />
      )}

      {/* Pending Bill Card */}
      {pendingBill && (
        <PendingCallCard
          call={pendingBill}
          token={token}
          showWaitTimeToCustomer={showWaitTimeToCustomer}
          texts={texts}
        />
      )}

      {/* Observation input section (available when at least one action is free) */}
      {available && hasAnyFreeType && (
        <div className="w-full">
          {!showNoteField ? (
            <button
              type="button"
              onClick={() => setShowNoteField(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 py-1 px-2 rounded-lg transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Adicionar observação opcional</span>
            </button>
          ) : (
            <div className="relative rounded-2xl border border-black/10 bg-white/80 p-3.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 animate-in fade-in">
              <div className="flex items-center justify-between pb-2">
                <label
                  htmlFor="call-note-field"
                  className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Observação para o garçom</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteField(false);
                    setNote("");
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  aria-label="Cancelar observação"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <Textarea
                id="call-note-field"
                placeholder={notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={140}
                showCount
                className="min-h-[72px] resize-none border-zinc-200/80 bg-white/90 text-sm placeholder:text-xs dark:border-zinc-800 dark:bg-zinc-950/80"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Section */}
      <div className="space-y-3 pt-1">
        {/* Call Waiter Button (if not already pending) */}
        {!pendingWaiter && (
          <Button
            type="button"
            size="table"
            variant="primary"
            disabled={!available || openCallMutation.isPending}
            isLoading={
              openCallMutation.isPending && activeSubmittingType === "WAITER"
            }
            onClick={() => handleOpenCall("WAITER")}
            className="w-full text-base sm:text-lg shadow-md hover:shadow-lg transition-all"
            aria-label={waiterButtonText}
          >
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
            <span className="truncate">{waiterButtonText}</span>
          </Button>
        )}

        {/* Request Bill Button (if not already pending) */}
        {!pendingBill && (
          <Button
            type="button"
            size="table"
            variant="outline"
            disabled={!available || openCallMutation.isPending}
            isLoading={
              openCallMutation.isPending && activeSubmittingType === "BILL"
            }
            onClick={() => handleOpenCall("BILL")}
            className="w-full text-base sm:text-lg border-2 border-zinc-300/80 bg-white/90 text-zinc-900 shadow-sm hover:bg-zinc-100 hover:border-zinc-400 active:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:border-zinc-600"
            aria-label={billButtonText}
          >
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">{billButtonText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
