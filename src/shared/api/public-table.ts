import { api } from "./client";
import type {
  PublicTableDto,
  PublicCallDto,
  PublicCallStateDto,
  CreatePublicCallRequest,
  ConfirmCallRequest,
} from "@/shared/types/api";
import { syncClock } from "@/shared/lib/clock";

const DEVICE_ID_STORAGE_KEY = "tapmesa:device-id";
let memoryDeviceId: string | null = null;

// Identificador estável do aparelho, enviado nas rotas públicas: o back limita e
// penaliza por aparelho, sem bloquear o Wi-Fi inteiro do restaurante
function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    memoryDeviceId ??= crypto.randomUUID();
    return memoryDeviceId;
  }
}

const deviceHeaders = () => ({ headers: { "X-Device-Id": getDeviceId() } });

export async function getPublicTable(token: string): Promise<PublicTableDto> {
  const response = await api.get<PublicTableDto>(
    `/public/tables/${token}`,
    deviceHeaders(),
  );
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

// Só os chamados ativos (mais leve que GET /public/tables/:token)
export async function getPublicTableCalls(
  token: string,
): Promise<PublicCallStateDto[]> {
  const response = await api.get<PublicCallStateDto[]>(
    `/public/tables/${token}/calls`,
    deviceHeaders(),
  );
  if (response.data[0]?.serverNow) {
    syncClock(response.data[0].serverNow);
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
    deviceHeaders(),
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
  await api.post(
    `/public/tables/${token}/calls/${callId}/cancel`,
    undefined,
    deviceHeaders(),
  );
}

export async function confirmPublicCall(
  token: string,
  callId: string,
  data?: ConfirmCallRequest,
): Promise<PublicCallDto> {
  const response = await api.post<PublicCallDto>(
    `/public/tables/${token}/calls/${callId}/confirm`,
    data || {},
    deviceHeaders(),
  );
  if (response.data?.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

export async function contestPublicCall(
  token: string,
  callId: string,
): Promise<PublicCallDto> {
  const response = await api.post<PublicCallDto>(
    `/public/tables/${token}/calls/${callId}/contest`,
    undefined,
    deviceHeaders(),
  );
  if (response.data?.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}
