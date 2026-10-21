import { create } from "zustand";
import type { AuthUser, Role } from "@/shared/types/api";
import { setAccessToken, setAuthTokenCallbacks } from "@/shared/api/client";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface ImpersonationState {
  originalAdminToken: string;
  originalAdminUser: AuthUser;
  targetRestaurantId: string;
  targetRestaurantName: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  impersonation: ImpersonationState | null;

  setAuth: (token: string, user: AuthUser) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  startImpersonation: (data: {
    accessToken: string;
    restaurantId: string;
    restaurantName: string;
    impersonatedUser?: AuthUser;
  }) => void;
  stopImpersonation: () => { originalRole: Role } | null;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Register automatic callbacks for client token refresh
  if (typeof window !== "undefined") {
    setAuthTokenCallbacks({
      onRefreshed: (token: string) => {
        set({ accessToken: token });
      },
      onExpired: () => {
        get().clearAuth();
      },
    });
  }

  return {
    accessToken: null,
    user: null,
    status: "loading",
    impersonation: null,

    setAuth: (token: string, user: AuthUser) => {
      setAccessToken(token);
      set({
        accessToken: token,
        user,
        status: "authenticated",
      });
    },

    setUser: (user: AuthUser | null) => {
      set({ user });
    },

    setStatus: (status: AuthStatus) => {
      set({ status });
    },

    startImpersonation: (data) => {
      const current = get();
      if (!current.accessToken || !current.user) return;

      const originalAdminToken =
        current.impersonation?.originalAdminToken || current.accessToken;
      const originalAdminUser =
        current.impersonation?.originalAdminUser || current.user;

      setAccessToken(data.accessToken);

      const impersonatedUser: AuthUser = data.impersonatedUser || {
        id: originalAdminUser.id,
        sub: originalAdminUser.sub,
        username: originalAdminUser.username,
        role: "OWNER",
        restaurantId: data.restaurantId,
        rid: data.restaurantId,
        imp: originalAdminUser.id,
      };

      set({
        accessToken: data.accessToken,
        user: impersonatedUser,
        status: "authenticated",
        impersonation: {
          originalAdminToken,
          originalAdminUser,
          targetRestaurantId: data.restaurantId,
          targetRestaurantName: data.restaurantName,
        },
      });
    },

    stopImpersonation: () => {
      const current = get();
      if (!current.impersonation) return null;

      const { originalAdminToken, originalAdminUser } = current.impersonation;
      setAccessToken(originalAdminToken);

      set({
        accessToken: originalAdminToken,
        user: originalAdminUser,
        impersonation: null,
        status: "authenticated",
      });

      return { originalRole: originalAdminUser.role };
    },

    clearAuth: () => {
      setAccessToken(null);
      set({
        accessToken: null,
        user: null,
        impersonation: null,
        status: "anonymous",
      });
    },
  };
});
