import { api } from "./client";
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
  RestaurantAppearance,
  UpdateAppearanceRequest,
  RestaurantTenantInfo,
} from "@/shared/types/api";

export async function getCurrentRestaurant(): Promise<RestaurantTenantInfo> {
  const response = await api.get<RestaurantTenantInfo>("/restaurant/current");
  return response.data;
}

export async function getServiceSettings(): Promise<ServiceSettings> {
  const response = await api.get<ServiceSettings>("/settings/service");
  return response.data;
}

export async function updateServiceSettings(
  data: UpdateServiceSettingsRequest,
): Promise<ServiceSettings> {
  const response = await api.put<ServiceSettings>("/settings/service", data);
  return response.data;
}

export async function getAppearance(): Promise<RestaurantAppearance> {
  const response = await api.get<RestaurantAppearance>("/settings/appearance");
  return response.data;
}

export async function updateAppearance(
  data: UpdateAppearanceRequest,
): Promise<RestaurantAppearance> {
  const response = await api.put<RestaurantAppearance>(
    "/settings/appearance",
    data,
  );
  return response.data;
}

export async function resetAppearance(): Promise<RestaurantAppearance> {
  const response = await api.post<RestaurantAppearance>(
    "/settings/appearance/reset",
  );
  return response.data;
}

export async function uploadLogo(file: File): Promise<RestaurantAppearance> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<RestaurantAppearance>(
    "/settings/appearance/logo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export async function uploadBackground(
  file: File,
): Promise<RestaurantAppearance> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<RestaurantAppearance>(
    "/settings/appearance/background",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}
