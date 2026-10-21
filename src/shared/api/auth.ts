import { api, setAccessToken } from "./client";
import type { LoginRequest, LoginResponse, AuthUser } from "@/shared/types/api";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", data);
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function refresh(): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/refresh");
  setAccessToken(response.data.accessToken);
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function getMe(): Promise<AuthUser> {
  const response = await api.get<AuthUser>("/auth/me");
  const user = response.data;
  return {
    ...user,
    id: user.id || user.sub,
    restaurantId: user.restaurantId || user.rid,
  };
}
