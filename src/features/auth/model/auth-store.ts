import { create } from "zustand";
import type { AuthUser, Role } from "@/shared/types/api";
import { setAccessToken, setAuthTokenCallbacks } from "@/shared/api/client";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

// `/auth/me` não devolve o username: guardamos o digitado no login para exibir
// após recarregar a página. Fica em localStorage (o painel costuma abrir em outra
// aba) junto com o id do usuário, para nunca exibir o nome de outra conta.
const USERNAME_STORAGE_KEY = "tapmesa:username";

export function readStoredUsername(userId: string): string | null {
  try {
    const stored = JSON.parse(
      localStorage.getItem(USERNAME_STORAGE_KEY) ?? "null",
    ) as { sub?: string; username?: string } | null;
    return stored?.sub === userId ? (stored.username ?? null) : null;
  } catch {
    return null;
  }
}

function storeUsername(userId: string | null, username: string | null) {
  try {
    if (userId && username)
      localStorage.setItem(
        USERNAME_STORAGE_KEY,
        JSON.stringify({ sub: userId, username }),
      );
    else localStorage.removeItem(USERNAME_STORAGE_KEY);
  } catch {
    // localStorage indisponível (modo privado): o nome só não é lembrado
  }
}

// Lê as claims do access token (mesmo conteúdo que `/auth/me` devolveria).
function decodeTokenClaims(token: string): AuthUser {
  const payload = (token.split(".")[1] ?? "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  return JSON.parse(atob(payload)) as AuthUser;
}

export interface ImpersonationState {
  originalAdminToken: string;
  originalAdminUser: AuthUser;
  originalAdminUsername: string | null;
  targetRestaurantId: string;
  targetRestaurantName: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  username: string | null;
  status: AuthStatus;
  impersonation: ImpersonationState | null;

  setAuth: (token: string, user: AuthUser, username?: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  startImpersonation: (data: {
    accessToken: string;
    restaurantId: string;
    restaurantName: string;
    ownerUsername: string;
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
    username: null,
    status: "loading",
    impersonation: null,

    setAuth: (token: string, user: AuthUser, username?: string | null) => {
      setAccessToken(token);
      if (username !== undefined) storeUsername(user.sub, username);
      set({
        accessToken: token,
        user,
        username: username !== undefined ? username : get().username,
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
      const originalAdminUsername = current.impersonation
        ? current.impersonation.originalAdminUsername
        : current.username;

      setAccessToken(data.accessToken);

      const impersonatedUser = decodeTokenClaims(data.accessToken);

      set({
        accessToken: data.accessToken,
        user: impersonatedUser,
        username: data.ownerUsername,
        status: "authenticated",
        impersonation: {
          originalAdminToken,
          originalAdminUser,
          originalAdminUsername,
          targetRestaurantId: data.restaurantId,
          targetRestaurantName: data.restaurantName,
        },
      });
    },

    stopImpersonation: () => {
      const current = get();
      if (!current.impersonation) return null;

      const { originalAdminToken, originalAdminUser, originalAdminUsername } =
        current.impersonation;
      setAccessToken(originalAdminToken);

      set({
        accessToken: originalAdminToken,
        user: originalAdminUser,
        username: originalAdminUsername,
        impersonation: null,
        status: "authenticated",
      });

      return { originalRole: originalAdminUser.role };
    },

    clearAuth: () => {
      setAccessToken(null);
      storeUsername(null, null);
      set({
        accessToken: null,
        user: null,
        username: null,
        impersonation: null,
        status: "anonymous",
      });
    },
  };
});
