import { api } from "./client";
import type {
  NotificationSettingsDto,
  UpdateNotificationSettingsRequest,
  SendDailySummaryResponse,
  SendUrgentAlertRequest,
  SendUrgentAlertResponse,
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

export async function sendDailySummaryTest(): Promise<SendDailySummaryResponse> {
  const response = await api.post<SendDailySummaryResponse>(
    "/restaurant/notifications/send-daily-summary",
  );
  return response.data;
}

// Valores de exemplo para o botão "Testar alerta urgente"; `force` ignora o cooldown
const URGENT_ALERT_TEST_PAYLOAD: SendUrgentAlertRequest = {
  tableNumber: 1,
  callType: "WAITER",
  waitDurationSec: 360,
  urgentThresholdSec: 300,
  force: true,
};

export async function sendUrgentAlertTest(): Promise<SendUrgentAlertResponse> {
  const response = await api.post<SendUrgentAlertResponse>(
    "/restaurant/notifications/send-urgent-alert",
    URGENT_ALERT_TEST_PAYLOAD,
  );
  return response.data;
}
