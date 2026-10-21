import { api } from "./client";
import type {
  AnalyticsSummaryResponse,
  AnalyticsByHourResponse,
  TablesRankingResponse,
  AnalyticsCallsResponse,
  AnalyticsCompareResponse,
} from "@/shared/types/api";

export async function getAnalyticsSummary(
  from: string,
  to: string,
): Promise<AnalyticsSummaryResponse> {
  const response = await api.get<AnalyticsSummaryResponse>(
    "/analytics/summary",
    {
      params: { from, to },
    },
  );
  return response.data;
}

export async function getAnalyticsByHour(
  from: string,
  to: string,
): Promise<AnalyticsByHourResponse> {
  const response = await api.get<AnalyticsByHourResponse>(
    "/analytics/by-hour",
    {
      params: { from, to },
    },
  );
  return response.data;
}

export async function getTablesRanking(
  from: string,
  to: string,
): Promise<TablesRankingResponse> {
  const response = await api.get<TablesRankingResponse>(
    "/analytics/tables-ranking",
    {
      params: { from, to },
    },
  );
  return response.data;
}

export interface AnalyticsCallsFilters {
  type?: string;
  status?: string;
  tableNumber?: number;
  from?: string;
  to?: string;
}

export async function getAnalyticsCalls(
  cursor?: string | null,
  limit = 20,
  filters?: AnalyticsCallsFilters,
): Promise<AnalyticsCallsResponse> {
  const response = await api.get<AnalyticsCallsResponse>("/analytics/calls", {
    params: {
      cursor: cursor || undefined,
      limit,
      ...filters,
    },
  });
  return response.data;
}

export async function getAnalyticsCompare(): Promise<AnalyticsCompareResponse> {
  const response = await api.get<AnalyticsCompareResponse>(
    "/analytics/summary/compare",
  );
  return response.data;
}

export function getExportCsvUrl(from: string, to: string): string {
  return `/analytics/export.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}
