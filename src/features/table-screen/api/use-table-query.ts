"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-client";
import { getPublicTable } from "@/shared/api/public-table";
import type { PublicTableDto } from "@/shared/types/api";

export function useTableQuery(token: string) {
  return useQuery<PublicTableDto>({
    queryKey: queryKeys.publicTable(token),
    queryFn: () => getPublicTable(token),
    enabled: Boolean(token),
    staleTime: 30_000,
    retry: (failureCount, error: unknown) => {
      // Não retentar em erros 404 de mesa não encontrada
      const status = (error as { response?: { status?: number } })?.response
        ?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}
