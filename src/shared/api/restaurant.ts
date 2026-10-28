import { api } from "./client";
import type { RestaurantTenantInfo, ServiceSettings } from "@/shared/types/api";

export async function getCurrentRestaurant(): Promise<RestaurantTenantInfo> {
  const response = await api.get<RestaurantTenantInfo>("/restaurant/current");
  return response.data;
}

// Fuso e virada do dia operacional, usados pelas métricas do OWNER.
// TODO: trocar por GET /restaurant/current quando o back expuser timezone e
// dayCutoffHour nesse endpoint (hoje ele só traz id, name, status e createdAt).
// É a única chamada a /settings/* que continua no front, até lá.
export async function getRestaurantOperationalSettings(): Promise<ServiceSettings> {
  const response = await api.get<ServiceSettings>("/settings/service");
  return response.data;
}
