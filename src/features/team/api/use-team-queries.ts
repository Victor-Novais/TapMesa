import { useQuery } from "@tanstack/react-query";
import { teamApi } from "@/shared/api";
import type { TeamUser, AttendantMetricsResponse } from "@/shared/types/api";

export const teamQueryKeys = {
  all: ["team"] as const,
  users: () => [...teamQueryKeys.all, "users"] as const,
  metrics: () => [...teamQueryKeys.all, "metrics"] as const,
};

export function useTeamUsersQuery() {
  return useQuery<TeamUser[]>({
    queryKey: teamQueryKeys.users(),
    queryFn: () => teamApi.listTeamUsers(),
    staleTime: 30_000,
  });
}

export function useAttendantMetricsQuery() {
  return useQuery<AttendantMetricsResponse>({
    queryKey: teamQueryKeys.metrics(),
    queryFn: () => teamApi.getAttendantMetrics(),
    staleTime: 30_000,
  });
}
