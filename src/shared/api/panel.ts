import { api } from "./client";
import type {
  StreamTicketResponse,
  PanelStateDto,
  PanelCallDto,
  RecentAttendedCallDto,
  AcknowledgedCallDto,
  AttendedCallDto,
} from "@/shared/types/api";
import { syncClock } from "@/shared/lib/clock";

export async function getPanelStreamTicket(): Promise<StreamTicketResponse> {
  const response = await api.post<StreamTicketResponse>("/panel/stream-ticket");
  return response.data;
}

export async function getPanelState(): Promise<PanelStateDto> {
  const response = await api.get<PanelStateDto>("/panel/state");
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

export async function getPanelCalls(): Promise<PanelCallDto[]> {
  const response = await api.get<PanelCallDto[]>("/panel/calls");
  if (response.data[0]?.serverNow) {
    syncClock(response.data[0].serverNow);
  }
  return response.data;
}

export async function getRecentCalls(
  limit = 15,
): Promise<RecentAttendedCallDto[]> {
  const response = await api.get<RecentAttendedCallDto[]>(
    "/panel/calls/recent",
    {
      params: { limit },
    },
  );
  if (response.data[0]?.serverNow) {
    syncClock(response.data[0].serverNow);
  }
  return response.data;
}

export async function assumePanelCall(
  id: string,
): Promise<AcknowledgedCallDto> {
  const response = await api.post<AcknowledgedCallDto>(
    `/panel/calls/${id}/assume`,
  );
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}

export async function attendPanelCall(id: string): Promise<AttendedCallDto> {
  const response = await api.post<AttendedCallDto>(`/panel/calls/${id}/attend`);
  if (response.data.serverNow) {
    syncClock(response.data.serverNow);
  }
  return response.data;
}
