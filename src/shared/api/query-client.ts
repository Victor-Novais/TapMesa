import { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  publicTable: (token: string) => ["publicTable", token] as const,
  panel: {
    state: ["panel", "state"] as const,
    calls: ["panel", "calls"] as const,
    recent: (limit?: number) => ["panel", "recent", limit] as const,
  },
  tables: {
    list: ["tables", "list"] as const,
    nextNumber: ["tables", "nextNumber"] as const,
    print: ["tables", "print"] as const,
  },
  analytics: {
    summary: (from: string, to: string) =>
      ["analytics", "summary", from, to] as const,
    byHour: (from: string, to: string) =>
      ["analytics", "byHour", from, to] as const,
    ranking: (from: string, to: string) =>
      ["analytics", "ranking", from, to] as const,
    calls: (filters?: Record<string, unknown>) =>
      ["analytics", "calls", filters] as const,
    compare: ["analytics", "compare"] as const,
  },
  team: {
    list: ["team", "list"] as const,
    metrics: ["team", "metrics"] as const,
  },
  settings: {
    currentRestaurant: ["settings", "currentRestaurant"] as const,
    service: ["settings", "service"] as const,
    appearance: ["settings", "appearance"] as const,
  },
  notifications: {
    settings: ["notifications", "settings"] as const,
  },
  admin: {
    restaurants: (cursor?: string | null) =>
      ["admin", "restaurants", cursor] as const,
    audit: (filters?: Record<string, unknown>) =>
      ["admin", "audit", filters] as const,
  },
};

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (failureCount, error) => {
          // Nunca tentar novamente em respostas 4xx (erro de cliente, 401, 403, 404, etc.)
          if (
            error instanceof AxiosError &&
            error.response?.status &&
            error.response.status >= 400 &&
            error.response.status < 500
          ) {
            return false;
          }
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false, // Sem retry automático em mutações
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
