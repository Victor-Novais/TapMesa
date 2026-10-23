import { api } from "./client";
import type {
  TeamUser,
  CreateTeamUserRequest,
  CreateTeamUserResponse,
  UpdateTeamUserStatusRequest,
  UpdateTeamUserStatusResponse,
  ResetTeamUserPasswordResponse,
  AttendantMetricsResponse,
} from "@/shared/types/api";

export async function listTeamUsers(): Promise<TeamUser[]> {
  const response = await api.get<TeamUser[]>("/restaurant/users");
  return response.data;
}

export async function createTeamUser(
  data: CreateTeamUserRequest,
): Promise<CreateTeamUserResponse> {
  const response = await api.post<CreateTeamUserResponse>(
    "/restaurant/users",
    data,
  );
  return response.data;
}

export async function updateTeamUserStatus(
  id: string,
  data: UpdateTeamUserStatusRequest,
): Promise<UpdateTeamUserStatusResponse> {
  const response = await api.patch<UpdateTeamUserStatusResponse>(
    `/restaurant/users/${id}/status`,
    data,
  );
  return response.data;
}

export async function resetTeamUserPassword(
  id: string,
): Promise<ResetTeamUserPasswordResponse> {
  const response = await api.post<ResetTeamUserPasswordResponse>(
    `/restaurant/users/${id}/reset-password`,
  );
  return response.data;
}

export async function deleteTeamUser(id: string): Promise<void> {
  await api.delete(`/restaurant/users/${id}`);
}

export async function getAttendantMetrics(): Promise<AttendantMetricsResponse> {
  const response = await api.get<AttendantMetricsResponse>(
    "/restaurant/users/metrics",
  );
  return response.data;
}
