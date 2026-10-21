"use client";

import { AuthGate, useAuth } from "@/features/auth";
import { Button } from "@/shared/ui/button";

export default function PanelPage() {
  const { user, logout } = useAuth();

  return (
    <AuthGate allowedRoles={["WAITER", "OWNER", "ADMIN"]}>
      <main className="flex min-h-screen flex-col p-6">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Painel de Atendimento
            </h1>
            <p className="text-sm text-zinc-500">
              Operador: {user?.username} ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            Sair
          </Button>
        </header>
        <div className="mt-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Fila operacional de chamados de garçom e pedidos de conta.
          </p>
        </div>
      </main>
    </AuthGate>
  );
}
