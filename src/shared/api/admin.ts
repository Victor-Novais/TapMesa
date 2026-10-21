import { api } from "./client";
import type {
  AdminRestaurantsResponse,
  CreateRestaurantRequest,
  CreateRestaurantResponse,
  ResetOwnerPasswordResponse,
  ImpersonateResponse,
  AdminAuditResponse,
} from "@/shared/types/api";

export async function listAdminRestaurants(
  cursor?: string | null,
  limit = 20,
): Promise<AdminRestaurantsResponse> {
  const response = await api.get<AdminRestaurantsResponse>(
    "/admin/restaurants",
    {
      params: {
        cursor: cursor || undefined,
        limit,
      },
    },
  );
  return response.data;
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
