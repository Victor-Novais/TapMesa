import { api } from "./client";
import type {
  AdminRestaurantItem,
  AdminRestaurantsResponse,
  CreateRestaurantRequest,
  CreateRestaurantResponse,
  ResetOwnerPasswordResponse,
  ImpersonateResponse,
  AdminAuditResponse,
} from "@/shared/types/api";

interface RawAdminRestaurantItem extends Partial<AdminRestaurantItem> {
  tablesCount?: number;
  usersCount?: number;
  createdAt?: string;
}

interface RawAdminRestaurantsPayload {
  items?: RawAdminRestaurantItem[];
  data?: RawAdminRestaurantItem[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

export async function listAdminRestaurants(
  cursor?: string | null,
  limit = 20,
): Promise<AdminRestaurantsResponse> {
  const response = await api.get<
    RawAdminRestaurantsPayload | RawAdminRestaurantItem[]
  >("/admin/restaurants", {
    params: {
      cursor: cursor || undefined,
      limit,
    },
  });
  const raw = response.data;
  const rawList: RawAdminRestaurantItem[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
        ? raw.data
        : [];

  const items: AdminRestaurantItem[] = rawList.map((item) => ({
    id: item.id || "",
    name: item.name || "",
    status: item.status || "ACTIVE",
    tablesCount: item.tablesCount ?? 0,
    usersCount: item.usersCount ?? 0,
    createdAt: item.createdAt
      ? new Date(item.createdAt).toISOString()
      : new Date().toISOString(),
    ownerUsername: item.ownerUsername,
  }));

  const nextCursor =
    !Array.isArray(raw) && raw?.nextCursor ? raw.nextCursor : null;
  const hasMore = Boolean(
    !Array.isArray(raw) &&
    (raw?.hasMore ?? (nextCursor !== null && nextCursor !== undefined)),
  );

  return {
    items,
    nextCursor,
    hasMore,
  };
}

export async function createAdminRestaurant(
  data: CreateRestaurantRequest,
): Promise<CreateRestaurantResponse> {
  const response = await api.post<CreateRestaurantResponse>(
    "/admin/restaurants",
    data,
  );
  return response.data;
}

export async function suspendAdminRestaurant(id: string): Promise<void> {
  await api.patch(`/admin/restaurants/${id}/suspend`);
}

export async function reactivateAdminRestaurant(id: string): Promise<void> {
  await api.patch(`/admin/restaurants/${id}/reactivate`);
}

export async function resetAdminOwnerPassword(
  id: string,
): Promise<ResetOwnerPasswordResponse> {
  const response = await api.post<ResetOwnerPasswordResponse>(
    `/admin/restaurants/${id}/reset-owner-password`,
  );
  return response.data;
}

export async function impersonateRestaurant(
  id: string,
): Promise<ImpersonateResponse> {
  const response = await api.post<ImpersonateResponse>(
    `/admin/restaurants/${id}/impersonate`,
  );
  return response.data;
}

export async function deleteAdminRestaurant(
  id: string,
  confirmName: string,
): Promise<void> {
  await api.delete(`/admin/restaurants/${id}`, {
    data: { confirmName },
  });
}

export interface AdminAuditFilters {
  restaurantId?: string;
  actorUserId?: string;
}

export async function listAdminAuditLogs(
  cursor?: string | null,
  limit = 50,
  filters?: AdminAuditFilters,
): Promise<AdminAuditResponse> {
  const response = await api.get<AdminAuditResponse>("/admin/audit", {
    params: {
      cursor: cursor || undefined,
      limit,
      ...filters,
    },
  });
  return response.data;
}
