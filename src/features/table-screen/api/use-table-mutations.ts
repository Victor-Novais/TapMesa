"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import {
  openPublicCall,
  cancelPublicCall,
  confirmPublicCall,
  contestPublicCall,
} from "@/shared/api/public-table";
import type {
  PublicTableDto,
  PublicCallDto,
  CreatePublicCallRequest,
  QuickRating,
} from "@/shared/types/api";
import { triggerHaptic } from "@/shared/lib/haptics";
import { parseApiError } from "@/shared/api/problem-details";

// As respostas dos POST públicos já trazem o chamado atualizado: nenhuma mutação
// refaz GET da mesa (o back limita os GET públicos por IP somando todas as mesas).

export function useOpenCallMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation<
    PublicCallDto,
    Error,
    CreatePublicCallRequest,
    { previousTable?: PublicTableDto }
  >({
    mutationFn: (data) => openPublicCall(token, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.publicTable(token),
      });

      const previousTable = queryClient.getQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
      );

      if (previousTable) {
        const optimisticCall: PublicCallDto = {
          id: `optimistic-${Date.now()}`,
          type: variables.type,
          status: "PENDING",
          note: variables.note?.trim() || null,
          createdAt: new Date().toISOString(),
          attendedAt: null,
          acknowledgedAt: null,
          rating: null,
          confirmationDeadline: null,
          reopenCount: 0,
          alreadyPending: false,
          serverNow: new Date().toISOString(),
        };

        queryClient.setQueryData<PublicTableDto>(
          queryKeys.publicTable(token),
          (old) => {
            if (!old) return old;
            const otherCalls = old.calls.filter(
              (c) => c.type !== variables.type,
            );
            return {
              ...old,
              calls: [optimisticCall, ...otherCalls],
            };
          },
        );
      }

      return { previousTable };
    },
    onSuccess: (data) => {
      triggerHaptic(25);

      queryClient.setQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
        (old) => {
          if (!old) return old;
          const otherCalls = old.calls.filter(
            (c) => c.type !== data.type && !c.id.startsWith("optimistic-"),
          );
          return {
            ...old,
            calls: [data, ...otherCalls],
          };
        },
      );
    },
    onError: (err, _variables, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(
          queryKeys.publicTable(token),
          context.previousTable,
        );
      }
      // Pausa não gera evento SSE: o 400 TABLE_PAUSED é como a tela descobre
      const problem = parseApiError(err);
      if (problem.code === "TABLE_PAUSED") {
        queryClient.setQueryData<PublicTableDto>(
          queryKeys.publicTable(token),
          (old) =>
            old && {
              ...old,
              available: false,
              unavailableReason: "TABLE_PAUSED",
              message: problem.detail,
            },
        );
      }
    },
  });
}

export function useCancelCallMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousTable?: PublicTableDto }>({
    mutationFn: (callId) => cancelPublicCall(token, callId),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.publicTable(token),
      });

      const previousTable = queryClient.getQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
      );

      if (previousTable) {
        queryClient.setQueryData<PublicTableDto>(
          queryKeys.publicTable(token),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              calls: old.calls.filter((c) => c.id !== callId),
            };
          },
        );
      }

      return { previousTable };
    },
    onSuccess: () => {
      triggerHaptic(25);
    },
    onError: (_err, _callId, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(
          queryKeys.publicTable(token),
          context.previousTable,
        );
      }
    },
  });
}

export function useConfirmCallMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation<
    PublicCallDto,
    Error,
    { callId: string; rating?: QuickRating },
    { previousTable?: PublicTableDto }
  >({
    mutationFn: ({ callId, rating }) =>
      confirmPublicCall(token, callId, rating ? { rating } : undefined),
    onMutate: async ({ callId, rating }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.publicTable(token),
      });

      const previousTable = queryClient.getQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
      );

      if (previousTable) {
        queryClient.setQueryData<PublicTableDto>(
          queryKeys.publicTable(token),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              calls: old.calls.map((c) => {
                if (c.id === callId) {
                  return {
                    ...c,
                    status: "CONFIRMED",
                    rating: rating ?? c.rating ?? null,
                  };
                }
                return c;
              }),
            };
          },
        );
      }

      return { previousTable };
    },
    onSuccess: (updatedCall) => {
      triggerHaptic(25);

      queryClient.setQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            calls: old.calls.map((c) =>
              c.id === updatedCall.id ? updatedCall : c,
            ),
          };
        },
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(
          queryKeys.publicTable(token),
          context.previousTable,
        );
      }
    },
  });
}

export function useContestCallMutation(token: string) {
  const queryClient = useQueryClient();

  return useMutation<
    PublicCallDto,
    Error,
    string,
    { previousTable?: PublicTableDto }
  >({
    mutationFn: (callId) => contestPublicCall(token, callId),
    onMutate: async (callId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.publicTable(token),
      });

      const previousTable = queryClient.getQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
      );

      if (previousTable) {
        queryClient.setQueryData<PublicTableDto>(
          queryKeys.publicTable(token),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              calls: old.calls.map((c) => {
                // No limite de reaberturas o back mantém o chamado ATTENDED
                if (c.id === callId && c.reopenCount < 2) {
                  return {
                    ...c,
                    status: "PENDING",
                    reopenCount: c.reopenCount + 1,
                  };
                }
                return c;
              }),
            };
          },
        );
      }

      return { previousTable };
    },
    onSuccess: (updatedCall) => {
      triggerHaptic(25);

      queryClient.setQueryData<PublicTableDto>(
        queryKeys.publicTable(token),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            calls: old.calls.map((c) =>
              c.id === updatedCall.id ? updatedCall : c,
            ),
          };
        },
      );
    },
    onError: (_err, _callId, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(
          queryKeys.publicTable(token),
          context.previousTable,
        );
      }
    },
  });
}
