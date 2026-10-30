"use client";

import * as React from "react";
import { usePanelStore } from "../model/panel-store";
import {
  assumePanelCall,
  attendPanelCall,
  getRecentCalls,
} from "@/shared/api/panel";
import { useAuth } from "@/features/auth";
import { triggerHaptic } from "@/shared/lib/haptics";
import { useToast } from "@/shared/ui/toast";
import type {
  ConfirmationStatus,
  RecentAttendedCallDto,
} from "@/shared/types/api";

const ACTION_ERROR_TOAST = {
  title: "Não foi possível atualizar o chamado.",
  description: "Tente de novo.",
  type: "error" as const,
};

export function usePanelActions() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Só as actions (referências estáveis da store). `calls` e `recent` são lidos
  // com getState() na hora da ação: assim os callbacks não mudam a cada evento
  // e os cards (memo) não re-renderizam todos juntos.
  const updateCall = usePanelStore((s) => s.updateCall);
  const removeCall = usePanelStore((s) => s.removeCall);
  const addCall = usePanelStore((s) => s.addCall);
  const addRecent = usePanelStore((s) => s.addRecent);
  const setRecent = usePanelStore((s) => s.setRecent);

  const [isLoadingRecent, setIsLoadingRecent] = React.useState(false);
  const [submittingIds, setSubmittingIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const clearSubmitting = React.useCallback((callId: string) => {
    setSubmittingIds((prev) => {
      const next = new Set(prev);
      next.delete(callId);
      return next;
    });
  }, []);

  const assumeCall = React.useCallback(
    async (callId: string): Promise<void> => {
      const call = usePanelStore.getState().calls.find((c) => c.id === callId);
      if (!call) return;

      const previousCall = { ...call };
      const currentUserId = user?.sub || "staff";

      setSubmittingIds((prev) => new Set(prev).add(callId));

      // Optimistic update
      updateCall(callId, {
        acknowledgedAt: new Date().toISOString(),
        acknowledgedById: currentUserId,
      });
      triggerHaptic(25);

      try {
        const result = await assumePanelCall(callId);
        // Atualiza com dados oficiais do servidor
        updateCall(callId, {
          acknowledgedAt: result.acknowledgedAt,
          acknowledgedById: result.acknowledgedById,
        });
      } catch {
        // Rollback on error (inclusive 429), com aviso ao garçom
        updateCall(callId, previousCall);
        toast(ACTION_ERROR_TOAST);
      } finally {
        clearSubmitting(callId);
      }
    },
    [user, updateCall, toast, clearSubmitting],
  );

  const attendCall = React.useCallback(
    async (callId: string): Promise<void> => {
      const call = usePanelStore.getState().calls.find((c) => c.id === callId);
      if (!call) return;

      const previousCall = { ...call };
      setSubmittingIds((prev) => new Set(prev).add(callId));

      // Optimistic update: move to recent queue
      removeCall(callId);
      const attendedAt = new Date().toISOString();
      const optimisticRecent: RecentAttendedCallDto = {
        id: call.id,
        restaurantId: call.restaurantId,
        tableId: call.tableId,
        tableNumber: call.tableNumber,
        type: call.type,
        status: "ATTENDED",
        confirmationStatus: "AWAITING_CONFIRMATION",
        note: call.note,
        createdAt: call.createdAt,
        originalCreatedAt: call.originalCreatedAt,
        acknowledgedAt: call.acknowledgedAt,
        acknowledgedById: call.acknowledgedById,
        firstAttendedAt: call.firstAttendedAt ?? attendedAt,
        attendedAt,
        confirmedAt: null,
        closedAt: null,
        attendedById: user?.sub ?? null,
        rating: null,
        reopenCount: call.reopenCount,
        reopened: call.reopened,
        contested: call.contested,
        reactionTimeSec: call.reactionTimeSec,
        executionTimeSec: null,
        responseTimeSec: null,
        resolutionTimeSec: null,
        serverNow: attendedAt,
      };
      addRecent(optimisticRecent);
      triggerHaptic(25);

      try {
        const result = await attendPanelCall(callId);
        // O SSE (call.confirmed/closed) pode chegar antes desta resposta: não
        // rebaixa um status que já avançou. Conta paga já volta CONFIRMED.
        const current = usePanelStore
          .getState()
          .recent.find((r) => r.id === callId);
        const confirmationStatus: ConfirmationStatus =
          result.status === "CONFIRMED"
            ? "CONFIRMED"
            : current && current.confirmationStatus !== "AWAITING_CONFIRMATION"
              ? current.confirmationStatus
              : "AWAITING_CONFIRMATION";
        // Atualiza item recente com os tempos e dados consolidados
        addRecent({
          ...optimisticRecent,
          ...result,
          ...(current?.status === "CONFIRMED" ||
          current?.status === "CLOSED_UNCONFIRMED"
            ? { status: current.status }
            : {}),
          confirmationStatus,
          responseTimeSec: Math.max(
            0,
            Math.round(
              (Date.parse(result.attendedAt) - Date.parse(result.createdAt)) /
                1000,
            ),
          ),
        });
      } catch {
        // Rollback: remove dos recentes (estado atual, não a cópia da closure,
        // para não apagar itens que chegaram nesse intervalo) e volta à fila
        setRecent(
          usePanelStore.getState().recent.filter((r) => r.id !== callId),
        );
        addCall(previousCall);
        toast(ACTION_ERROR_TOAST);
      } finally {
        clearSubmitting(callId);
      }
    },
    [user, removeCall, addRecent, setRecent, addCall, toast, clearSubmitting],
  );

  const loadRecent = React.useCallback(
    async (limit = 15): Promise<void> => {
      setIsLoadingRecent(true);
      try {
        const items = await getRecentCalls(limit);
        setRecent(items);
      } finally {
        setIsLoadingRecent(false);
      }
    },
    [setRecent],
  );

  const isSubmitting = React.useCallback(
    (id: string) => submittingIds.has(id),
    [submittingIds],
  );

  return {
    assumeCall,
    attendCall,
    loadRecent,
    isLoadingRecent,
    isSubmitting,
  };
}
