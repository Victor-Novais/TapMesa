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
      const currentUserId = user?.id || user?.sub || "staff";

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
      const optimisticRecent: RecentAttendedCallDto = {
        id: call.id,
        tableNumber: call.tableNumber,
        type: call.type,
        status: "ATTENDED",
        attendedAt: new Date().toISOString(),
        rating: null,
        executionTimeSec: 0,
        serverNow: new Date().toISOString(),
      };
      addRecent(optimisticRecent);
      triggerHaptic(25);

      try {
        const result = await attendPanelCall(callId);
        // Atualiza item recente com os tempos e dados consolidados
        addRecent({
          id: result.id,
          tableNumber: result.tableNumber,
          type: result.type,
          status: "ATTENDED",
          attendedAt: result.attendedAt,
          rating: result.rating ?? null,
          executionTimeSec: result.executionTimeSec ?? 0,
          serverNow: result.serverNow,
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
    [calls, recent, removeCall, addRecent, setRecent, addCall],
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
