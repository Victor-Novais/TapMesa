import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tablesApi } from "@/shared/api";
import { tablesQueryKeys } from "./use-tables-query";
import type { TableDto, CreateTablesRequest } from "@/shared/types/api";

export function useCreateTablesMutation() {
  const queryClient = useQueryClient();

  return useMutation<TableDto[], Error, CreateTablesRequest>({
    mutationFn: (data) => tablesApi.createTables(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.all });
    },
  });
}

export function usePauseTableMutation() {
  const queryClient = useQueryClient();

  return useMutation<TableDto, Error, string, { previousTables?: TableDto[] }>({
    mutationFn: (id: string) => tablesApi.pauseTable(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: tablesQueryKeys.list() });
      const previousTables = queryClient.getQueryData<TableDto[]>(
        tablesQueryKeys.list(),
      );

      if (previousTables) {
        queryClient.setQueryData<TableDto[]>(
          tablesQueryKeys.list(),
          previousTables.map((t) => (t.id === id ? { ...t, paused: true } : t)),
        );
      }

      return { previousTables };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(
          tablesQueryKeys.list(),
          context.previousTables,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.list() });
    },
  });
}

export function useResumeTableMutation() {
  const queryClient = useQueryClient();

  return useMutation<TableDto, Error, string, { previousTables?: TableDto[] }>({
    mutationFn: (id: string) => tablesApi.resumeTable(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: tablesQueryKeys.list() });
      const previousTables = queryClient.getQueryData<TableDto[]>(
        tablesQueryKeys.list(),
      );

      if (previousTables) {
        queryClient.setQueryData<TableDto[]>(
          tablesQueryKeys.list(),
          previousTables.map((t) =>
            t.id === id ? { ...t, paused: false } : t,
          ),
        );
      }

      return { previousTables };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(
          tablesQueryKeys.list(),
          context.previousTables,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.list() });
    },
  });
}

export function useDeleteTableMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previousTables?: TableDto[] }>({
    mutationFn: (id: string) => tablesApi.deleteTable(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: tablesQueryKeys.list() });
      const previousTables = queryClient.getQueryData<TableDto[]>(
        tablesQueryKeys.list(),
      );

      if (previousTables) {
        queryClient.setQueryData<TableDto[]>(
          tablesQueryKeys.list(),
          previousTables.filter((t) => t.id !== id),
        );
      }

      return { previousTables };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(
          tablesQueryKeys.list(),
          context.previousTables,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tablesQueryKeys.all });
    },
  });
}
