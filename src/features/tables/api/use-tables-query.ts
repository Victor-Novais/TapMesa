import { useQuery } from "@tanstack/react-query";
import { tablesApi } from "@/shared/api";
import type {
  TableDto,
  NextTableNumberResponse,
  TablesPrintViewResponse,
} from "@/shared/types/api";

export const tablesQueryKeys = {
  all: ["tables"] as const,
  list: () => [...tablesQueryKeys.all, "list"] as const,
  nextNumber: () => [...tablesQueryKeys.all, "next-number"] as const,
  printView: () => [...tablesQueryKeys.all, "print-view"] as const,
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

export function useTablesPrintViewQuery() {
  return useQuery<TablesPrintViewResponse>({
    queryKey: tablesQueryKeys.printView(),
    queryFn: () => tablesApi.getTablesPrintView(),
    staleTime: 60_000,
  });
}
