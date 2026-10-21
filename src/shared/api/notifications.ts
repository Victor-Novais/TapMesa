import { api } from "./client";
import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsRequest,
} from "@/shared/types/api";

export async function getNotificationSettings(): Promise<NotificationSettingsDto> {
  const response = await api.get<NotificationSettingsDto>(
    "/restaurant/notifications/settings",
  );
  return response.data;
}

export async function updateNotificationSettings(
  data: UpdateNotificationSettingsRequest,
): Promise<NotificationSettingsDto> {
  const response = await api.patch<NotificationSettingsDto>(
    "/restaurant/notifications/settings",
    data,
  );
  return response.data;
}

export async function sendDailySummaryTest(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await api.post<{ success: boolean; message: string }>(
    "/restaurant/notifications/send-daily-summary",
  );
  return response.data;
}

export async function sendUrgentAlertTest(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await api.post<{ success: boolean; message: string }>(
    "/restaurant/notifications/send-urgent-alert",
  );
  return response.data;
}
