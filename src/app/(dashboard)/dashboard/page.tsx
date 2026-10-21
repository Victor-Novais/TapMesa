"use client";

import { AuthGate, useAuth } from "@/features/auth";
import { Button } from "@/shared/ui/button";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGate allowedRoles={["OWNER", "ADMIN"]}>
      <main className="flex min-h-screen flex-col p-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Dashboard do Restaurante
            </h1>
            <p className="text-sm text-zinc-500">
              Usuário: {user?.username} ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sair
          </Button>
        </header>
        <div className="mt-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Visão geral da operação, métricas e gestão de mesas.
          </p>
        </div>
      </main>
    </AuthGate>
  );
}
