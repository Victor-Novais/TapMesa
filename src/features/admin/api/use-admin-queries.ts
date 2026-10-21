import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/shared/api";
import { queryKeys } from "@/shared/api/query-client";
import type {
  AdminRestaurantsResponse,
  AdminAuditResponse,
} from "@/shared/types/api";

export function useAdminRestaurantsQuery(cursor?: string | null, limit = 20) {
  return useQuery<AdminRestaurantsResponse>({
    queryKey: queryKeys.admin.restaurants(cursor),
    queryFn: () => adminApi.listAdminRestaurants(cursor, limit),
    staleTime: 30_000,
  });
}

export function useAdminAuditLogsQuery(
  cursor?: string | null,
  limit = 50,
  filters?: { restaurantId?: string; actorUserId?: string },
) {
  return useQuery<AdminAuditResponse>({
    queryKey: queryKeys.admin.audit({ cursor, limit, ...filters }),
    queryFn: () => adminApi.listAdminAuditLogs(cursor, limit, filters),
    staleTime: 15_000,
  });
}
