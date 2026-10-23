"use client";

import * as React from "react";
import {
  Bell,
  Receipt,
  MessageSquare,
  AlertCircle,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { PendingCallCard } from "./pending-call-card";
import { AttendedCallCard } from "./attended-call-card";
import { ConfirmedCallCard } from "./confirmed-call-card";
import { useOpenCallMutation } from "../api/use-table-mutations";
import { getAccessibleTextColor } from "../lib/contrast";
import { parseApiError } from "@/shared/api/problem-details";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { cn } from "@/shared/lib/cn";
import type { PublicCallDto, CallType } from "@/shared/types/api";

// Limite oficial da observação do chamado (o back recusa acima disso)
export const MAX_CALL_NOTE_LENGTH = 150;

export interface CallActionsProps {
  token: string;
  calls: PublicCallDto[];
  available?: boolean;
  showWaitTimeToCustomer?: boolean;
  texts?: Record<string, string>;
  colors?: Record<string, string>;
  className?: string;
}

export function CallActions({
  token,
  calls,
  available = true,
  showWaitTimeToCustomer = false,
  texts = {},
  colors = {},
  className,
}: CallActionsProps) {
  const [note, setNote] = React.useState("");
  const [showNoteField, setShowNoteField] = React.useState(false);
  const [activeSubmittingType, setActiveSubmittingType] =
    React.useState<CallType | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [dismissedConfirmedIds, setDismissedConfirmedIds] = React.useState<
    Set<string>
  >(() => new Set());
  const [dismissedExpired, setDismissedExpired] = React.useState(false);

  const openCallMutation = useOpenCallMutation(token);

  // Filtra chamados ativos por tipo
  const waiterCall = calls.find((c) => c.type === "WAITER");
  const billCall = calls.find((c) => c.type === "BILL");

  // Exibe aviso gentil se houver chamado expirado ainda não dispensado
  const hasExpired = calls.some((c) => c.status === "EXPIRED");
  const showExpiredNotice = hasExpired && !dismissedExpired;

  // Estados específicos para WAITER
  const isWaiterPending = waiterCall?.status === "PENDING";
  const isWaiterAttended = waiterCall?.status === "ATTENDED";
  const isWaiterConfirmed =
    waiterCall?.status === "CONFIRMED" &&
    !dismissedConfirmedIds.has(waiterCall.id);
  const isWaiterActive =
    isWaiterPending || isWaiterAttended || isWaiterConfirmed;

  // Estados específicos para BILL
  const isBillPending = billCall?.status === "PENDING";
  const isBillAttended = billCall?.status === "ATTENDED";
  const isBillConfirmed =
    billCall?.status === "CONFIRMED" && !dismissedConfirmedIds.has(billCall.id);
  const isBillActive = isBillPending || isBillAttended || isBillConfirmed;

  // Campo de observação disponível se ao menos uma das ações estiver livre
  const hasAnyFreeType = !isWaiterActive || !isBillActive;

  const waiterButtonText =
    texts.callWaiterButton || UI_MESSAGES.calls.callWaiter;

  const billButtonText =
    texts.requestBillButton || UI_MESSAGES.calls.requestBill;

  const notePlaceholder =
    texts.notePlaceholder || UI_MESSAGES.calls.notePlaceholder;

  // Cor do botão da conta escolhida pelo dono em Aparência (colors.secondary)
  const billButtonStyle: React.CSSProperties | undefined = colors.secondary
    ? {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
        color: getAccessibleTextColor("#ffffff", colors.secondary),
      }
    : undefined;

  const handleDismissConfirmed = (callId: string) => {
    setDismissedConfirmedIds((prev) => new Set(prev).add(callId));
  };

  const handleOpenCall = (type: CallType) => {
    if (!available || openCallMutation.isPending) return;

    setActiveSubmittingType(type);
    setErrorMessage(null);

    const callNote = note.trim()
      ? note.trim().slice(0, MAX_CALL_NOTE_LENGTH)
      : undefined;

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
            className="text-red-600 hover:text-red-800 dark:text-red-400 min-h-[44px] min-w-[44px] -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg"
            aria-label="Fechar aviso de erro"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Gentle expired notice */}
      {showExpiredNotice && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-3.5 text-left shadow-sm backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/80 animate-in fade-in"
        >
          <div className="flex items-start gap-2 min-w-0">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
              {UI_MESSAGES.calls.expiredNotice}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissedExpired(true)}
            className="text-amber-700 hover:text-amber-900 dark:text-amber-300 min-h-[44px] min-w-[44px] -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* WAITER Active States */}
      {waiterCall && isWaiterConfirmed && (
        <ConfirmedCallCard
          call={waiterCall}
          onDismiss={() => handleDismissConfirmed(waiterCall.id)}
        />
      )}

      {waiterCall && isWaiterAttended && (
        <AttendedCallCard call={waiterCall} token={token} texts={texts} />
      )}

      {waiterCall && isWaiterPending && (
        <PendingCallCard
          call={waiterCall}
          token={token}
          showWaitTimeToCustomer={showWaitTimeToCustomer}
          texts={texts}
        />
      )}

      {/* BILL Active States */}
      {billCall && isBillConfirmed && (
        <ConfirmedCallCard
          call={billCall}
          onDismiss={() => handleDismissConfirmed(billCall.id)}
        />
      )}

      {billCall && isBillAttended && (
        <AttendedCallCard call={billCall} token={token} texts={texts} />
      )}

      {billCall && isBillPending && (
        <PendingCallCard
          call={billCall}
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
              className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 py-2 px-3 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <MessageSquare className="h-4 w-4" />
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
                  <span>Observação para a equipe</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowNoteField(false);
                    setNote("");
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 min-h-[44px] min-w-[44px] -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg"
                  aria-label="Cancelar observação"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                id="call-note-field"
                placeholder={notePlaceholder}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={MAX_CALL_NOTE_LENGTH}
                showCount
                className="min-h-[72px] resize-none border-zinc-200/80 bg-white/90 text-sm placeholder:text-xs dark:border-zinc-800 dark:bg-zinc-950/80"
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Section (rendered for whichever call type is currently free) */}
      <div className="space-y-3 pt-1">
        {/* Call Waiter Button (if not already active) */}
        {!isWaiterActive && (
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

        {/* Request Bill Button (if not already active) */}
        {!isBillActive && (
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
            style={billButtonStyle}
            aria-label={billButtonText}
          >
            <Receipt
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 shrink-0",
                billButtonStyle
                  ? "text-current"
                  : "text-emerald-600 dark:text-emerald-400",
              )}
            />
            <span className="truncate">{billButtonText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
