"use client";

import { useEffect, useCallback, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { refresh, getMe, logout as apiLogout } from "@/shared/api/auth";
import { setAccessToken } from "@/shared/api/client";
import { useAuthStore } from "../model/auth-store";
import type { AuthUser, Role } from "@/shared/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  status: "loading" | "authenticated" | "anonymous";
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status, setAuth, clearAuth } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignora erro no logout remoto se a rede falhar
    } finally {
      clearAuth();
      queryClient.clear();
      router.push("/login");
    }
  }, [clearAuth, queryClient, router]);

  useEffect(() => {
    let isMounted = true;

    async function bootSession() {
      try {
        const refreshResponse = await refresh();
        setAccessToken(refreshResponse.accessToken);
        const currentUser = await getMe();

        if (isMounted) {
          setAuth(refreshResponse.accessToken, currentUser);
        }
      } catch {
        if (isMounted) {
          clearAuth();
        }
      }
    }

    bootSession();

    return () => {
      isMounted = false;
    };
  }, [setAuth, clearAuth]);

  const value: AuthContextValue = {
    user,
    role: user?.role ?? null,
    status,
    isAuthenticated: status === "authenticated",
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um <AuthProvider />");
  }
  return context;
}
