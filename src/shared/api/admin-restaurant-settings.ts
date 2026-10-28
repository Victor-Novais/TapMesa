import { api } from "./client";
import type {
  ServiceSettings,
  UpdateServiceSettingsRequest,
  RestaurantAppearance,
  UpdateAppearanceRequest,
  NotificationSettingsDto,
  UpdateNotificationSettingsRequest,
  SendDailySummaryRequest,
  SendDailySummaryResponse,
} from "@/shared/types/api";

// Configurações de um restaurante, feitas pelo ADMIN com o próprio token
// (docs/api/FRONTEND_MIGRATION_ADMIN_SETTINGS.md, seção 3)
const base = (restaurantId: string) =>
  `/admin/restaurants/${encodeURIComponent(restaurantId)}`;

export async function getServiceSettings(
  restaurantId: string,
): Promise<ServiceSettings> {
  const response = await api.get<ServiceSettings>(
    `${base(restaurantId)}/settings/service`,
  );
  return response.data;
}

export async function updateServiceSettings(
  restaurantId: string,
  data: UpdateServiceSettingsRequest,
): Promise<ServiceSettings> {
  const response = await api.put<ServiceSettings>(
    `${base(restaurantId)}/settings/service`,
    data,
  );
  return response.data;
}

export async function getAppearance(
  restaurantId: string,
): Promise<RestaurantAppearance> {
  const response = await api.get<RestaurantAppearance>(
    `${base(restaurantId)}/settings/appearance`,
  );
  return response.data;
}

export async function updateAppearance(
  restaurantId: string,
  data: UpdateAppearanceRequest,
): Promise<RestaurantAppearance> {
  const response = await api.put<RestaurantAppearance>(
    `${base(restaurantId)}/settings/appearance`,
    data,
  );
  return response.data;
}

export async function resetAppearance(
  restaurantId: string,
): Promise<RestaurantAppearance> {
  const response = await api.post<RestaurantAppearance>(
    `${base(restaurantId)}/settings/appearance/reset`,
  );
  return response.data;
}

// Campo "file". O axios troca o "multipart/form-data" pelo cabeçalho do
// navegador, com o boundary; sem ele o FormData seria serializado como JSON.
function uploadImage(path: string, file: File): Promise<RestaurantAppearance> {
  const formData = new FormData();
  formData.append("file", file);

  return api
    .post<RestaurantAppearance>(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => response.data);
}

export function uploadLogo(
  restaurantId: string,
  file: File,
): Promise<RestaurantAppearance> {
  return uploadImage(`${base(restaurantId)}/settings/appearance/logo`, file);
}

export function uploadBackground(
  restaurantId: string,
  file: File,
): Promise<RestaurantAppearance> {
  return uploadImage(
    `${base(restaurantId)}/settings/appearance/background`,
    file,
  );
}

export async function getNotificationSettings(
  restaurantId: string,
): Promise<NotificationSettingsDto> {
  const response = await api.get<NotificationSettingsDto>(
    `${base(restaurantId)}/notifications/settings`,
  );
  return response.data;
}

export async function updateNotificationSettings(
  restaurantId: string,
  data: UpdateNotificationSettingsRequest,
): Promise<NotificationSettingsDto> {
  const response = await api.patch<NotificationSettingsDto>(
    `${base(restaurantId)}/notifications/settings`,
    data,
  );
  return response.data;
}

export async function sendDailySummaryTest(
  restaurantId: string,
  data: SendDailySummaryRequest = {},
): Promise<SendDailySummaryResponse> {
  const response = await api.post<SendDailySummaryResponse>(
    `${base(restaurantId)}/notifications/send-daily-summary`,
    data,
  );
  return response.data;
}
