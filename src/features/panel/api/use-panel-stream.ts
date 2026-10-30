"use client";

import * as React from "react";
import { useShallow } from "zustand/react/shallow";
import { usePanelStore } from "../model/panel-store";
import {
  getPanelStreamTicket,
  getPanelState,
  getPanelCalls,
  getRecentCalls,
} from "@/shared/api/panel";
import type {
  AlertRaisedEventData,
  PanelCallDto,
  PanelCallEventData,
  PanelRealtimeEventMap,
  RecentAttendedCallDto,
} from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export interface UsePanelStreamOptions {
  enabled?: boolean;
  onCallCreated?: (call: PanelCallDto) => void;
  onCallReopened?: (event: PanelCallEventData) => void;
  onAlertRaised?: (alert: AlertRaisedEventData) => void;
}

export function usePanelStream(options: UsePanelStreamOptions = {}) {
  const {
    enabled = true,
    onCallCreated,
    onCallReopened,
    onAlertRaised,
  } = options;

  // Seletor: o hook (e a página) só re-renderiza quando esses campos mudam,
  // não a cada chamado novo na fila
  const {
    setSnapshot,
    addCall,
    updateCall,
    removeCall,
    addRecent,
    updateRecent,
    setRecent,
    setConnectionStatus,
    setIsPollingFallback,
    connectionStatus,
    isPollingFallback,
  } = usePanelStore(
    useShallow((s) => ({
      setSnapshot: s.setSnapshot,
      addCall: s.addCall,
      updateCall: s.updateCall,
      removeCall: s.removeCall,
      addRecent: s.addRecent,
      updateRecent: s.updateRecent,
      setRecent: s.setRecent,
      setConnectionStatus: s.setConnectionStatus,
      setIsPollingFallback: s.setIsPollingFallback,
      connectionStatus: s.connectionStatus,
      isPollingFallback: s.isPollingFallback,
    })),
  );

  const [reconnectTrigger, setReconnectTrigger] = React.useState(0);

  const debounceCallsTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const debounceRecentTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Debounced fetch da fila (ex.: chamado contestado volta para a fila)
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

  // Debounced fetch da gaveta de atendidos recentes
  const triggerDebouncedRecentRefresh = React.useCallback(() => {
    if (debounceRecentTimerRef.current) {
      clearTimeout(debounceRecentTimerRef.current);
    }
    debounceRecentTimerRef.current = setTimeout(async () => {
      try {
        setRecent(await getRecentCalls());
      } catch {
        // Ignora erro de refresh em background
      }
    }, 300);
  }, [setRecent]);

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

        // Payloads do canal do painel (docs/api/FRONTEND_INTEGRATION.md, seção 6)
        const parse = <K extends keyof PanelRealtimeEventMap>(
          e: MessageEvent,
        ): PanelRealtimeEventMap[K] | null => {
          try {
            return JSON.parse(e.data) as PanelRealtimeEventMap[K];
          } catch {
            return null;
          }
        };

        // 3. call.opened: em call.opened, `type` é o tipo do chamado (WAITER | BILL)
        es.addEventListener("call.opened", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.opened">(e);
          if (!data) return;
          const newCall: PanelCallDto = {
            id: data.callId,
            restaurantId: data.restaurantId,
            tableId: data.tableId,
            tableNumber: data.tableNumber ?? 0,
            type: data.type === "BILL" ? "BILL" : "WAITER",
            status: "PENDING",
            note: data.note ?? null,
            createdAt: data.occurredAt,
            originalCreatedAt: data.occurredAt,
            acknowledgedAt: null,
            acknowledgedById: null,
            firstAttendedAt: null,
            reopenCount: 0,
            reopened: false,
            contested: false,
            reactionTimeSec: null,
            serverNow: data.occurredAt,
          };

          addCall(newCall);
          onCallCreated?.(newCall);
        });

        // 4. call.acknowledged (assume/acknowledge)
        es.addEventListener("call.acknowledged", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.acknowledged">(e);
          if (!data) return;
          updateCall(data.callId, {
            acknowledgedAt: data.occurredAt,
            acknowledgedById: data.actorUserId,
          });
        });

        // 5. call.attended: o payload não traz mesa nem tipo; copiamos do item da fila
        es.addEventListener("call.attended", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.attended">(e);
          if (!data) return;
          const queued = usePanelStore
            .getState()
            .calls.find((c) => c.id === data.callId);
          removeCall(data.callId);
          if (!queued) {
            // Já atendido por este painel (item otimista na gaveta) ou fora da
            // fila local: só busca a gaveta completa no segundo caso
            const inRecent = usePanelStore
              .getState()
              .recent.some((r) => r.id === data.callId);
            if (!inRecent) triggerDebouncedRecentRefresh();
            return;
          }
          const executionTimeSec = queued.acknowledgedAt
            ? Math.max(
                0,
                Math.round(
                  (Date.parse(data.occurredAt) -
                    Date.parse(queued.acknowledgedAt)) /
                    1000,
                ),
              )
            : null;
          const recentItem: RecentAttendedCallDto = {
            id: queued.id,
            restaurantId: queued.restaurantId,
            tableId: queued.tableId,
            tableNumber: queued.tableNumber,
            type: queued.type,
            status: "ATTENDED",
            confirmationStatus: "AWAITING_CONFIRMATION",
            note: queued.note,
            createdAt: queued.createdAt,
            originalCreatedAt: queued.originalCreatedAt,
            acknowledgedAt: queued.acknowledgedAt,
            acknowledgedById: queued.acknowledgedById,
            firstAttendedAt: queued.firstAttendedAt ?? data.occurredAt,
            attendedAt: data.occurredAt,
            confirmedAt: null,
            closedAt: null,
            attendedById: data.actorUserId,
            rating: null,
            reopenCount: queued.reopenCount,
            reopened: queued.reopened,
            contested: queued.contested,
            reactionTimeSec: queued.reactionTimeSec,
            executionTimeSec,
            responseTimeSec: Math.max(
              0,
              Math.round(
                (Date.parse(data.occurredAt) - Date.parse(queued.createdAt)) /
                  1000,
              ),
            ),
            resolutionTimeSec: null,
            serverNow: data.occurredAt,
          };
          addRecent(recentItem);
        });

        // 6. call.confirmed / call.closed: atualizam o item da gaveta
        es.addEventListener("call.confirmed", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.confirmed">(e);
          if (!data) return;
          updateRecent(data.callId, {
            status: "CONFIRMED",
            confirmationStatus: "CONFIRMED",
            confirmedAt: data.occurredAt,
            rating: data.rating ?? null,
          });
        });

        es.addEventListener("call.closed", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.closed">(e);
          if (!data) return;
          updateRecent(data.callId, {
            status: "CLOSED_UNCONFIRMED",
            confirmationStatus: "CLOSED_UNCONFIRMED",
            closedAt: data.occurredAt,
          });
        });

        // 7. call.reopened: o chamado saiu da fila ao ser atendido; a fila é
        // recarregada (GET /panel/calls traz `reopened: true` e o reopenCount atual)
        es.addEventListener("call.reopened", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.reopened">(e);
          if (!data) return;
          updateRecent(data.callId, {
            status: "PENDING",
            confirmationStatus: "CONTESTED",
            reopened: true,
            ...(data.reopenCount !== undefined
              ? { reopenCount: data.reopenCount }
              : {}),
          });
          triggerDebouncedCallsRefresh();
          onCallReopened?.(data);
        });

        // 8. call.cancelled / call.expired: saem da fila
        const handleRemoved = (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.cancelled">(e);
          if (data) removeCall(data.callId);
        };
        es.addEventListener("call.cancelled", handleRemoved);
        es.addEventListener("call.expired", handleRemoved);

        // 9. table.removed: remove da fila os chamados da mesa excluída
        es.addEventListener("table.removed", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"table.removed">(e);
          if (!data) return;
          usePanelStore
            .getState()
            .calls.filter((c) => c.tableId === data.tableId)
            .forEach((c) => removeCall(c.id));
        });

        // 10. alert.raised: alerta de urgência (job do back ou envio manual)
        es.addEventListener("alert.raised", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"alert.raised">(e);
          if (data) onAlertRaised?.(data);
        });

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
      if (debounceRecentTimerRef.current) {
        clearTimeout(debounceRecentTimerRef.current);
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
    triggerDebouncedRecentRefresh,
    onCallCreated,
    onCallReopened,
    onAlertRaised,
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
