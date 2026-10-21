"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { openPublicCall, cancelPublicCall } from "@/shared/api/public-table";
import type {
  PublicTableDto,
  PublicCallDto,
  CreatePublicCallRequest,
} from "@/shared/types/api";
import { triggerHaptic } from "@/shared/lib/haptics";

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
    onError: (_err, _variables, context) => {
      if (context?.previousTable) {
        queryClient.setQueryData(
          queryKeys.publicTable(token),
          context.previousTable,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicTable(token),
      });
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
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.publicTable(token),
      });
    },
  });
}
