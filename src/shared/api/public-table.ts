import { api } from "./client";
import type {
  PublicTableDto,
  PublicCallDto,
  CreatePublicCallRequest,
  ConfirmCallRequest,
} from "@/shared/types/api";
import { syncClock } from "@/shared/lib/clock";

export async function getPublicTable(token: string): Promise<PublicTableDto> {
  const response = await api.get<PublicTableDto>(`/public/tables/${token}`);
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

export async function openPublicCall(
  token: string,
  data: CreatePublicCallRequest,
): Promise<PublicCallDto> {
  const response = await api.post<PublicCallDto>(
    `/public/tables/${token}/calls`,
    data,
  );
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

export async function cancelPublicCall(
  token: string,
  callId: string,
): Promise<void> {
  await api.post(`/public/tables/${token}/calls/${callId}/cancel`);
}

export async function confirmPublicCall(
  token: string,
  callId: string,
  data: ConfirmCallRequest,
): Promise<void> {
  await api.post(`/public/tables/${token}/calls/${callId}/confirm`, data);
}

export async function contestPublicCall(
  token: string,
  callId: string,
): Promise<void> {
  await api.post(`/public/tables/${token}/calls/${callId}/contest`);
}
