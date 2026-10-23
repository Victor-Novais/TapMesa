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
import type { RecentAttendedCallDto } from "@/shared/types/api";

export function usePanelActions() {
  const { user } = useAuth();
  const {
    calls,
    recent,
    updateCall,
    removeCall,
    addCall,
    addRecent,
    setRecent,
  } = usePanelStore();

  const [isLoadingRecent, setIsLoadingRecent] = React.useState(false);
  const [submittingIds, setSubmittingIds] = React.useState<Set<string>>(
    () => new Set(),
  );

  const assumeCall = React.useCallback(
    async (callId: string): Promise<void> => {
      const call = calls.find((c) => c.id === callId);
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
      } catch (err: unknown) {
        // Rollback on error
        updateCall(callId, previousCall);
        throw err;
      } finally {
        setSubmittingIds((prev) => {
          const next = new Set(prev);
          next.delete(callId);
          return next;
        });
      }
    },
    [calls, user, updateCall],
  );

  const attendCall = React.useCallback(
    async (callId: string): Promise<void> => {
      const call = calls.find((c) => c.id === callId);
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
        // Atualiza item recente com os tempos e dados consolidados
        addRecent({
          ...optimisticRecent,
          ...result,
          confirmationStatus: "AWAITING_CONFIRMATION",
          responseTimeSec: Math.max(
            0,
            Math.round(
              (Date.parse(result.attendedAt) - Date.parse(result.createdAt)) /
                1000,
            ),
          ),
        });
      } catch (err: unknown) {
        // Rollback: remove from recent and restore to active calls
        setRecent(recent.filter((r) => r.id !== callId));
        addCall(previousCall);
        throw err;
      } finally {
        setSubmittingIds((prev) => {
          const next = new Set(prev);
          next.delete(callId);
          return next;
        });
      }
    },
    [calls, recent, user, removeCall, addRecent, setRecent, addCall],
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

  return {
    assumeCall,
    attendCall,
    loadRecent,
    isLoadingRecent,
    isSubmitting: (id: string) => submittingIds.has(id),
  };
}
