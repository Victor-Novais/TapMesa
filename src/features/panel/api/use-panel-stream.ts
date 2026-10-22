"use client";

import * as React from "react";
import { usePanelStore } from "../model/panel-store";
import {
  getPanelStreamTicket,
  getPanelState,
  getPanelCalls,
} from "@/shared/api/panel";
import type { PanelCallDto, RecentAttendedCallDto } from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface UsePanelStreamOptions {
  enabled?: boolean;
  onCallCreated?: (call: Partial<PanelCallDto>) => void;
  onCallReopened?: (call: Partial<PanelCallDto>) => void;
}

export function usePanelStream(options: UsePanelStreamOptions = {}) {
  const { enabled = true, onCallCreated, onCallReopened } = options;

  const {
    setSnapshot,
    addCall,
    updateCall,
    removeCall,
    addRecent,
    updateRecent,
    setConnectionStatus,
    setIsPollingFallback,
    connectionStatus,
    isPollingFallback,
  } = usePanelStore();

  const [reconnectTrigger, setReconnectTrigger] = React.useState(0);

  const debounceCallsTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Debounced fetch de calls completas para enriquecer chamados parciais
  const triggerDebouncedCallsRefresh = React.useCallback(() => {
    if (debounceCallsTimerRef.current) {
      clearTimeout(debounceCallsTimerRef.current);
    }
    debounceCallsTimerRef.current = setTimeout(async () => {
      try {
        const fullCalls = await getPanelCalls();
        fullCalls.forEach((call) => addCall(call));
      } catch {
        // Ignora erro de refresh em background
      }
    }, 300);
  }, [addCall]);

  React.useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    let isClosed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let pollingTimer: ReturnType<typeof setInterval> | null = null;
    let retryDelay = 3000;

    const startPolling = () => {
      if (pollingTimer) return;
      setIsPollingFallback(true);

      pollingTimer = setInterval(async () => {
        if (isClosed) return;
        try {
          const state = await getPanelState();
          setSnapshot(state);
        } catch {
          // Continua tentando em background
        }
      }, 10_000);
    };

    const stopPolling = () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = null;
      }
      setIsPollingFallback(false);
    };

    async function openConnection() {
      if (isClosed) return;

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      setConnectionStatus("reconnecting");

      try {
        // 1. Solicita ticket descartável de uso único (expira em 60s)
        const ticketResponse = await getPanelStreamTicket();
        if (isClosed) return;

        const streamUrl = `${API_BASE_URL}/panel/stream?ticket=${encodeURIComponent(
          ticketResponse.ticket,
        )}`;

        const es = new EventSource(streamUrl);
        eventSource = es;

        es.onopen = () => {
          if (isClosed) return;
          setConnectionStatus("connected");
          stopPolling();
          retryDelay = 3000;
        };

        // 2. Snapshot completo do salão
        es.addEventListener("snapshot", (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const snapshot = JSON.parse(e.data);
            setSnapshot(snapshot);
          } catch {
            // Ignora JSON malformado
          }
        });

        // 3. CALL_CREATED / call.opened
        const handleCreated = (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const newCall: PanelCallDto = {
              id: data.callId || data.id,
              tableNumber: data.tableNumber ?? 0,
              type: data.type || "WAITER",
              status: "PENDING",
              note: data.note || null,
              createdAt:
                data.occurredAt || data.createdAt || new Date().toISOString(),
              acknowledgedAt: null,
              acknowledgedById: null,
              firstAttendedAt: null,
              attendedAt: null,
              reopenCount: data.reopenCount ?? 0,
              serverNow: new Date().toISOString(),
            };

            addCall(newCall);
            onCallCreated?.(newCall);

            triggerDebouncedCallsRefresh();
          } catch {
            triggerDebouncedCallsRefresh();
          }
        };

        es.addEventListener("CALL_CREATED", handleCreated);
        es.addEventListener("call.opened", handleCreated);

        // 4. CALL_ACKNOWLEDGED / CALL_ASSUMED / call.acknowledged
        const handleAssumed = (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const callId = data.callId || data.id;
            if (callId) {
              updateCall(callId, {
                acknowledgedAt: data.occurredAt || new Date().toISOString(),
                acknowledgedById: data.actorUserId || data.acknowledgedById,
              });
            }
          } catch {
            // Ignora erro
          }
        };

        es.addEventListener("CALL_ACKNOWLEDGED", handleAssumed);
        es.addEventListener("CALL_ASSUMED", handleAssumed);
        es.addEventListener("call.acknowledged", handleAssumed);

        // 5. CALL_ATTENDED / call.attended
        const handleAttended = (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const callId = data.callId || data.id;
            if (callId) {
              removeCall(callId);
              const recentItem: RecentAttendedCallDto = {
                id: callId,
                tableNumber: data.tableNumber ?? 0,
                type: data.type || "WAITER",
                status: "ATTENDED",
                attendedAt: data.occurredAt || new Date().toISOString(),
                rating: null,
                executionTimeSec: data.executionTimeSec ?? 0,
                serverNow: new Date().toISOString(),
              };
              addRecent(recentItem);
            }
          } catch {
            // Ignora erro
          }
        };

        es.addEventListener("CALL_ATTENDED", handleAttended);
        es.addEventListener("call.attended", handleAttended);

        // 6. CALL_CONFIRMED / call.confirmed / CALL_CLOSED_UNCONFIRMED / call.closed
        const handleClosed = (
          e: MessageEvent,
          status: "CONFIRMED" | "CLOSED_UNCONFIRMED",
        ) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const callId = data.callId || data.id;
            if (callId) {
              updateRecent(callId, {
                status,
                rating: data.rating ?? null,
              });
            }
          } catch {
            // Ignora erro
          }
        };

        es.addEventListener("CALL_CONFIRMED", (e) =>
          handleClosed(e, "CONFIRMED"),
        );
        es.addEventListener("call.confirmed", (e) =>
          handleClosed(e, "CONFIRMED"),
        );
        es.addEventListener("CALL_CLOSED_UNCONFIRMED", (e) =>
          handleClosed(e, "CLOSED_UNCONFIRMED"),
        );
        es.addEventListener("call.closed", (e) =>
          handleClosed(e, "CLOSED_UNCONFIRMED"),
        );

        // 7. CALL_REOPENED / call.reopened
        const handleReopened = (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const callId = data.callId || data.id;
            if (callId) {
              updateCall(callId, {
                status: "PENDING",
                reopenCount: (data.reopenCount ?? 0) + 1,
              });
              onCallReopened?.(data);
            }
          } catch {
            triggerDebouncedCallsRefresh();
          }
        };

        es.addEventListener("CALL_REOPENED", handleReopened);
        es.addEventListener("call.reopened", handleReopened);

        // 8. CALL_CANCELLED / call.cancelled / CALL_EXPIRED / call.expired
        const handleRemoved = (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const data = JSON.parse(e.data);
            const callId = data.callId || data.id;
            if (callId) {
              removeCall(callId);
            }
          } catch {
            // Ignora erro
          }
        };

        es.addEventListener("CALL_CANCELLED", handleRemoved);
        es.addEventListener("call.cancelled", handleRemoved);
        es.addEventListener("CALL_EXPIRED", handleRemoved);
        es.addEventListener("call.expired", handleRemoved);

        // Tratamento de queda do EventSource
        es.onerror = () => {
          if (isClosed) return;
          setConnectionStatus("offline");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          startPolling();

          reconnectTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 30_000);
            void openConnection();
          }, retryDelay);
        };
      } catch {
        if (!isClosed) {
          setConnectionStatus("offline");
          startPolling();
          reconnectTimer = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 1.5, 30_000);
            void openConnection();
          }, retryDelay);
        }
      }
    }

    void openConnection();

    // Ressincronização ao voltar para a aba
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          const state = await getPanelState();
          setSnapshot(state);
        } catch {
          // Ignora falha de sync temporária
        }
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          void openConnection();
        }
      }
    };

    // Ressincronização ao recuperar rede
    const handleOnline = async () => {
      try {
        const state = await getPanelState();
        setSnapshot(state);
      } catch {
        // Ignora falha
      }
      void openConnection();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      isClosed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
      if (debounceCallsTimerRef.current) {
        clearTimeout(debounceCallsTimerRef.current);
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [
    enabled,
    reconnectTrigger,
    setSnapshot,
    addCall,
    updateCall,
    removeCall,
    addRecent,
    updateRecent,
    setConnectionStatus,
    setIsPollingFallback,
    triggerDebouncedCallsRefresh,
    onCallCreated,
    onCallReopened,
  ]);

  const reconnect = React.useCallback(() => {
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  return {
    connectionStatus,
    isPollingFallback,
    reconnect,
  };
}
