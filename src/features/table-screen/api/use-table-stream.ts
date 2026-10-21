"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { syncClock } from "@/shared/lib/clock";
import type { ConnectionStatus } from "@/shared/ui/connection-indicator";
import type { PublicTableDto, PublicCallDto } from "@/shared/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

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
          // Reconcilia o estado completo ao abrir conexão
          queryClient.invalidateQueries({
            queryKey: queryKeys.publicTable(token),
          });
        };

        // 1. Snapshot inicial enviado pelo backend
        es.addEventListener("snapshot", (e: MessageEvent) => {
          if (isClosed) return;
          try {
            const snapshot = JSON.parse(e.data) as {
              tableNumber: number;
              calls: PublicCallDto[];
              serverNow: string;
            };

            if (snapshot.serverNow) {
              syncClock(snapshot.serverNow);
            }

            queryClient.setQueryData<PublicTableDto>(
              queryKeys.publicTable(token),
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  tableNumber: snapshot.tableNumber ?? old.tableNumber,
                  calls: snapshot.calls ?? old.calls,
                  serverNow: snapshot.serverNow ?? old.serverNow,
                };
              },
            );
          } catch {
            // Ignora JSON malformado
          }
        });

        // 2. Eventos de Chamados
        const callEvents = [
          "CALL_CREATED",
          "CALL_ACKNOWLEDGED",
          "CALL_ASSUMED",
          "CALL_ATTENDED",
          "CALL_CONFIRMED",
          "CALL_CANCELLED",
          "CALL_EXPIRED",
          "CALL_CLOSED_UNCONFIRMED",
        ];

        callEvents.forEach((eventName) => {
          es.addEventListener(eventName, (e: MessageEvent) => {
            if (isClosed) return;
            try {
              const data = JSON.parse(e.data) as {
                callId?: string;
                type?: string;
                occurredAt?: string;
              };

              // Se for transição direta para ATTENDED ou CONFIRMED, aplicar patch instantâneo
              if (
                data.callId &&
                (eventName === "CALL_ATTENDED" ||
                  eventName === "CALL_CONFIRMED")
              ) {
                queryClient.setQueryData<PublicTableDto>(
                  queryKeys.publicTable(token),
                  (old) => {
                    if (!old) return old;
                    return {
                      ...old,
                      calls: old.calls.map((c) => {
                        if (c.id === data.callId) {
                          return {
                            ...c,
                            status:
                              eventName === "CALL_ATTENDED"
                                ? "ATTENDED"
                                : "CONFIRMED",
                            attendedAt:
                              eventName === "CALL_ATTENDED"
                                ? data.occurredAt || new Date().toISOString()
                                : c.attendedAt,
                          };
                        }
                        return c;
                      }),
                    };
                  },
                );
              }
            } catch {
              // Em caso de falha no parse do payload parcial, reconciliação via GET trata
            }

            // Reconcilia com GET oficial para garantir todos os campos
            queryClient.invalidateQueries({
              queryKey: queryKeys.publicTable(token),
            });
          });
        });

        // 3. Mesa Pausada
        es.addEventListener("TABLE_PAUSED", () => {
          if (isClosed) return;
          queryClient.setQueryData<PublicTableDto>(
            queryKeys.publicTable(token),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                available: false,
                unavailableReason: "TABLE_PAUSED",
              };
            },
          );
        });

        // 4. Mesa Retomada
        es.addEventListener("TABLE_RESUMED", () => {
          if (isClosed) return;
          queryClient.setQueryData<PublicTableDto>(
            queryKeys.publicTable(token),
            (old) => {
              if (!old) return old;
              return {
                ...old,
                available: true,
                unavailableReason: null,
              };
            },
          );
        });

        // 5. Mesa Removida / Deletada
        const handleRemoved = () => {
          if (isClosed) return;
          setIsDeleted(true);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          setConnectionStatus("offline");
        };

        es.addEventListener("TABLE_DELETED", handleRemoved);
        es.addEventListener("table.removed", handleRemoved);

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

    // Reconciliação ao voltar para a aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.publicTable(token),
        });
        if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
          openStream(true);
        }
      }
    };

    // Reconciliação ao recuperar rede
    const handleOnline = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicTable(token),
      });
      openStream(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      isClosed = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
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
