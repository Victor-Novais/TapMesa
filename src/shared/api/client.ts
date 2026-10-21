import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/shared/config/env";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

type TokenRefreshedCallback = (token: string) => void;
type AuthExpiredCallback = () => void;

let onTokenRefreshed: TokenRefreshedCallback | null = null;
let onAuthExpired: AuthExpiredCallback | null = null;

export const setAuthTokenCallbacks = (callbacks: {
  onRefreshed?: TokenRefreshedCallback;
  onExpired?: AuthExpiredCallback;
}) => {
  if (callbacks.onRefreshed) onTokenRefreshed = callbacks.onRefreshed;
  if (callbacks.onExpired) onAuthExpired = callbacks.onExpired;
};

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor de Requisição: Injeta o Access Token em memória e o X-Request-Id
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (!config.headers["X-Request-Id"]) {
    config.headers["X-Request-Id"] =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2);
  }

  return config;
});

// Interceptor de Resposta: Trata 401 e realiza o Refresh Automático com fila única
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<{ accessToken: string }>(
          "/auth/refresh",
        );
        const newAccessToken = response.data.accessToken;

        setAccessToken(newAccessToken);
        if (onTokenRefreshed) {
          onTokenRefreshed(newAccessToken);
        }
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (onAuthExpired) {
          onAuthExpired();
        }

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login") &&
          !window.location.pathname.startsWith("/m/")
        ) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.href = "/login?expired=true";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
