"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuthStore } from "../model/auth-store";

export function ImpersonationBar() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { impersonation, stopImpersonation } = useAuthStore();

  if (!impersonation) {
    return null;
  }

  const handleExit = () => {
    stopImpersonation();
    queryClient.clear();
    router.push("/admin");
  };

  return (
    <aside
      role="status"
      aria-label="Aviso de impersonação"
      className="fixed inset-x-0 top-0 z-50 flex min-h-[44px] flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500 px-4 py-2 text-amber-950 shadow-md dark:bg-amber-600 dark:text-amber-50"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-900 dark:text-amber-100" />
        <span>
          <strong>Modo Suporte:</strong> Você está acessando o restaurante{" "}
          <span className="font-bold underline decoration-amber-900/40 dark:decoration-amber-100/40">
            {impersonation.targetRestaurantName}
          </span>
          . Ações de alteração serão registradas na auditoria.
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleExit}
        className="h-8 border-amber-900/30 bg-amber-100/80 text-xs font-semibold text-amber-950 hover:bg-white hover:text-amber-950 dark:border-amber-400/40 dark:bg-amber-700 dark:text-amber-50 dark:hover:bg-amber-800"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Sair do modo suporte
      </Button>
    </aside>
  );
}
