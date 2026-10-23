import { api } from "./client";
import type {
  TableDto,
  CreateTablesRequest,
  NextTableNumberResponse,
  TablesPrintViewResponse,
} from "@/shared/types/api";

export async function listTables(): Promise<TableDto[]> {
  const response = await api.get<TableDto[]>("/tables");
  return response.data;
}

export async function getNextTableNumber(): Promise<NextTableNumberResponse> {
  const response = await api.get<NextTableNumberResponse>(
    "/tables/next-number",
  );
  return response.data;
}

export async function createTables(
  data: CreateTablesRequest,
): Promise<TableDto[]> {
  const response = await api.post<TableDto[]>("/tables", data);
  return response.data;
}

export async function pauseTable(id: string): Promise<TableDto> {
  const response = await api.patch<TableDto>(`/tables/${id}/pause`);
  return response.data;
}

export async function resumeTable(id: string): Promise<TableDto> {
  const response = await api.patch<TableDto>(`/tables/${id}/resume`);
  return response.data;
}

export async function deleteTable(id: string): Promise<void> {
  await api.delete(`/tables/${id}`);
}

export async function getTablesPrintView(): Promise<TablesPrintViewResponse> {
  const response = await api.get<TablesPrintViewResponse>("/tables/print");
  return response.data;
}

export function getTableQrSvgUrl(id: string): string {
  return `/tables/${id}/qr?format=svg`;
}

export async function getTableQrSvg(id: string): Promise<string> {
  const response = await api.get<string>(getTableQrSvgUrl(id), {
    responseType: "text",
  });
  return response.data;
}
