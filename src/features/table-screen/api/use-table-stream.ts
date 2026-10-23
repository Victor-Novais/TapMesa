"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { getPublicTableCalls } from "@/shared/api/public-table";
import { syncClock } from "@/shared/lib/clock";
import type { ConnectionStatus } from "@/shared/ui/connection-indicator";
import type {
  PublicTableDto,
  PublicCallDto,
  PublicCallStateDto,
  PublicTableRealtimeEventMap,
} from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Os clientes de um restaurante costumam compartilhar o IP (Wi-Fi) e o back limita
// os GET públicos por IP somando todas as mesas. Por isso o estado é atualizado a
// partir dos eventos e só recorremos a GET /calls quando falta algum dado.
const CALLS_REFRESH_DEBOUNCE_MS = 500;

/**
 * Aplica a lista de chamados ativos vinda do servidor (snapshot ou GET /calls),
 * preservando os campos que só o estado local conhece (rating, acknowledgedAt) e os
 * chamados finalizados que a tela ainda exibe (agradecimento e aviso de expiração).
 */
function mergeActiveCalls(
  current: PublicCallDto[],
  active: PublicCallStateDto[],
): PublicCallDto[] {
  const byId = new Map(current.map((c) => [c.id, c]));
  const merged: PublicCallDto[] = active.map((state) => ({
    acknowledgedAt: null,
    rating: null,
    ...byId.get(state.id),
    ...state,
  }));
  const activeIds = new Set(active.map((c) => c.id));
  const activeTypes = new Set(active.map((c) => c.type));
  const kept = current.filter(
    (c) =>
      !activeIds.has(c.id) &&
      !activeTypes.has(c.type) &&
      (c.status === "CONFIRMED" || c.status === "EXPIRED"),
  );
  return [...merged, ...kept];
}

export function useTableStream(token: string) {
  const queryClient = useQueryClient();
  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatus>("reconnecting");
  const [isDeleted, setIsDeleted] = React.useState(false);
  const [reconnectTrigger, setReconnectTrigger] = React.useState(0);

  React.useEffect(() => {
    if (!token || typeof window === "undefined") {
      return;
    }

    let isClosed = false;
    let eventSource: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const queryKey = queryKeys.publicTable(token);

    const updateCalls = (
      updater: (calls: PublicCallDto[]) => PublicCallDto[],
    ) => {
      queryClient.setQueryData<PublicTableDto>(queryKey, (old) =>
        old ? { ...old, calls: updater(old.calls) } : old,
      );
    };

    const patchCall = (callId: string, patch: Partial<PublicCallDto>) => {
      updateCalls((calls) =>
        calls.map((c) => (c.id === callId ? { ...c, ...patch } : c)),
      );
    };

    const hasCall = (callId: string) =>
      Boolean(
        queryClient
          .getQueryData<PublicTableDto>(queryKey)
          ?.calls.some((c) => c.id === callId),
      );

    // Um único GET /calls (debounced) quando o evento não traz o que a tela precisa.
    // `needsRefresh` é reavaliado no disparo: se a resposta do POST já trouxe o
    // chamado nesse intervalo, nenhum GET é feito.
    const scheduleCallsRefresh = (needsRefresh: () => boolean) => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(async () => {
        if (isClosed || !needsRefresh()) return;
        try {
          const active = await getPublicTableCalls(token);
          if (!isClosed)
            updateCalls((calls) => mergeActiveCalls(calls, active));
        } catch {
          // O próximo evento ou reconexão reconcilia o estado
        }
      }, CALLS_REFRESH_DEBOUNCE_MS);
    };

    const parse = <K extends keyof PublicTableRealtimeEventMap>(
      e: MessageEvent,
    ): PublicTableRealtimeEventMap[K] | null => {
      try {
        return JSON.parse(e.data) as PublicTableRealtimeEventMap[K];
      } catch {
        return null;
      }
    };

    function openStream(isRetry = false) {
      if (isClosed) return;

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }

      if (isRetry) {
        setConnectionStatus("reconnecting");
      }

      const streamUrl = `${API_BASE_URL}/public/tables/${encodeURIComponent(token)}/stream`;

      try {
        const es = new EventSource(streamUrl);
        eventSource = es;

        es.onopen = () => {
          if (isClosed) return;
          setConnectionStatus("connected");
          retryDelay = 1000;
        };

        // 1. Snapshot: primeiro evento de toda conexão (inclusive reconexões),
        // já traz os chamados ativos; dispensa GET ao reconectar
        es.addEventListener("snapshot", (e: MessageEvent) => {
          if (isClosed) return;
          const snapshot = parse<"snapshot">(e);
          if (!snapshot) return;
          syncClock(snapshot.serverNow);
          updateCalls((calls) => mergeActiveCalls(calls, snapshot.calls));
        });

        // 2. Eventos de chamados (payload público: callId, type, occurredAt)
        es.addEventListener("call.opened", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.opened">(e);
          // Chamado aberto por outro aparelho da mesa: o evento não traz tipo nem observação
          if (data && !hasCall(data.callId)) {
            scheduleCallsRefresh(() => !hasCall(data.callId));
          }
        });

        es.addEventListener("call.acknowledged", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.acknowledged">(e);
          if (data) patchCall(data.callId, { acknowledgedAt: data.occurredAt });
        });

        es.addEventListener("call.attended", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.attended">(e);
          if (!data) return;
          // O payload não traz confirmationDeadline; não buscamos GET /calls por
          // evento (limite de GETs públicos por IP): o contador só aparece quando
          // o prazo vier do servidor (carga inicial ou snapshot de reconexão)
          patchCall(data.callId, {
            status: "ATTENDED",
            attendedAt: data.occurredAt,
          });
        });

        es.addEventListener("call.reopened", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.reopened">(e);
          if (!data) return;
          // A resposta do POST de contestação já atualiza o próprio aparelho
          const current = queryClient
            .getQueryData<PublicTableDto>(queryKey)
            ?.calls.find((c) => c.id === data.callId);
          if (current && current.status !== "PENDING") {
            patchCall(data.callId, {
              status: "PENDING",
              confirmationDeadline: null,
              reopenCount: current.reopenCount + 1,
            });
          }
        });

        es.addEventListener("call.confirmed", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.confirmed">(e);
          if (data) patchCall(data.callId, { status: "CONFIRMED" });
        });

        es.addEventListener("call.closed", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.closed">(e);
          if (data)
            updateCalls((calls) => calls.filter((c) => c.id !== data.callId));
        });

        es.addEventListener("call.cancelled", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.cancelled">(e);
          if (data)
            updateCalls((calls) => calls.filter((c) => c.id !== data.callId));
        });

        // Expirado continua na lista para exibir o aviso ao cliente
        es.addEventListener("call.expired", (e: MessageEvent) => {
          if (isClosed) return;
          const data = parse<"call.expired">(e);
          if (data) patchCall(data.callId, { status: "EXPIRED" });
        });

        // 3. Mesa removida: o servidor encerra a conexão em seguida; não reconectar
        es.addEventListener("table.removed", () => {
          if (isClosed) return;
          isClosed = true;
          setIsDeleted(true);
          es.close();
          eventSource = null;
          setConnectionStatus("offline");
        });

        // Tratamento de erro e desconexão
        es.onerror = () => {
          if (isClosed) return;
          setConnectionStatus("offline");
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          retryTimeout = setTimeout(() => {
            // Backoff exponencial de 1s a 30s
            retryDelay = Math.min(retryDelay * 1.5, 30_000);
            openStream(true);
          }, retryDelay);
        };
      } catch {
        if (!isClosed) {
          setConnectionStatus("offline");
        }
      }
    }

    openStream(false);

    // Ao voltar para a aba ou recuperar a rede, reabre o stream se caiu:
    // o snapshot da nova conexão reconcilia os chamados
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (!eventSource || eventSource.readyState === EventSource.CLOSED)
      ) {
        if (retryTimeout) clearTimeout(retryTimeout);
        openStream(true);
      }
    };

    const handleOnline = () => {
      if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
        if (retryTimeout) clearTimeout(retryTimeout);
        openStream(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      isClosed = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [token, queryClient, reconnectTrigger]);

  const reconnect = React.useCallback(() => {
    setConnectionStatus("reconnecting");
    setReconnectTrigger((prev) => prev + 1);
  }, []);

  return {
    connectionStatus,
    isDeleted,
    reconnect,
  };
}
