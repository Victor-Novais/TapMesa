import { useQuery } from "@tanstack/react-query";
import { tablesApi } from "@/shared/api";
import type { TableDto, NextTableNumberResponse } from "@/shared/types/api";

export const tablesQueryKeys = {
  all: ["tables"] as const,
  list: () => [...tablesQueryKeys.all, "list"] as const,
  nextNumber: () => [...tablesQueryKeys.all, "next-number"] as const,
};

export function useTablesQuery() {
  return useQuery<TableDto[]>({
    queryKey: tablesQueryKeys.list(),
    queryFn: () => tablesApi.listTables(),
    staleTime: 30_000,
  });
}

export function useNextTableNumberQuery(enabled = true) {
  return useQuery<NextTableNumberResponse>({
    queryKey: tablesQueryKeys.nextNumber(),
    queryFn: () => tablesApi.getNextTableNumber(),
    enabled,
    staleTime: 5_000,
  });
}
