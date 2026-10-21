import { useQuery } from "@tanstack/react-query";
import { analyticsApi, settingsApi } from "@/shared/api";
import type { AnalyticsCallsFilters } from "@/shared/api/analytics";
import type {
  AnalyticsSummaryResponse,
  AnalyticsCompareResponse,
  AnalyticsByHourResponse,
  TablesRankingResponse,
  AnalyticsCallsResponse,
  ServiceSettings,
} from "@/shared/types/api";

export const analyticsQueryKeys = {
  all: ["analytics"] as const,
  summary: (from: string, to: string) =>
    [...analyticsQueryKeys.all, "summary", { from, to }] as const,
  compare: () => [...analyticsQueryKeys.all, "compare"] as const,
  byHour: (from: string, to: string) =>
    [...analyticsQueryKeys.all, "by-hour", { from, to }] as const,
  ranking: (from: string, to: string) =>
    [...analyticsQueryKeys.all, "ranking", { from, to }] as const,
  calls: (
    cursor?: string | null,
    limit = 20,
    filters?: AnalyticsCallsFilters,
  ) =>
    [
      ...analyticsQueryKeys.all,
      "calls",
      { cursor, limit, ...filters },
    ] as const,
  serviceSettings: () => ["settings", "service"] as const,
};

export function useServiceSettingsQuery() {
  return useQuery<ServiceSettings>({
    queryKey: analyticsQueryKeys.serviceSettings(),
    queryFn: () => settingsApi.getServiceSettings(),
    staleTime: 60_000,
  });
}

export function useAnalyticsSummaryQuery(
  from: string,
  to: string,
  autoRefresh = false,
) {
  return useQuery<AnalyticsSummaryResponse>({
    queryKey: analyticsQueryKeys.summary(from, to),
    queryFn: () => analyticsApi.getAnalyticsSummary(from, to),
    enabled: Boolean(from && to),
    staleTime: autoRefresh ? 15_000 : 60_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });
}

export function useAnalyticsCompareQuery() {
  return useQuery<AnalyticsCompareResponse>({
    queryKey: analyticsQueryKeys.compare(),
    queryFn: () => analyticsApi.getAnalyticsCompare(),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useAnalyticsByHourQuery(
  from: string,
  to: string,
  autoRefresh = false,
) {
  return useQuery<AnalyticsByHourResponse>({
    queryKey: analyticsQueryKeys.byHour(from, to),
    queryFn: () => analyticsApi.getAnalyticsByHour(from, to),
    enabled: Boolean(from && to),
    staleTime: autoRefresh ? 15_000 : 60_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });
}

export function useTablesRankingQuery(
  from: string,
  to: string,
  autoRefresh = false,
) {
  return useQuery<TablesRankingResponse>({
    queryKey: analyticsQueryKeys.ranking(from, to),
    queryFn: () => analyticsApi.getTablesRanking(from, to),
    enabled: Boolean(from && to),
    staleTime: autoRefresh ? 15_000 : 60_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });
}

export function useAnalyticsCallsQuery(
  cursor?: string | null,
  limit = 20,
  filters?: AnalyticsCallsFilters,
) {
  return useQuery<AnalyticsCallsResponse>({
    queryKey: analyticsQueryKeys.calls(cursor, limit, filters),
    queryFn: () => analyticsApi.getAnalyticsCalls(cursor, limit, filters),
    staleTime: 15_000,
  });
}
