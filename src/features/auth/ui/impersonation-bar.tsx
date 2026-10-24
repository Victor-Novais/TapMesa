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
      className="fixed inset-x-0 top-0 z-50 flex min-h-11 flex-wrap items-center justify-between gap-3 bg-warning px-4 py-2 text-on-warning shadow-elevation-2"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden />
        <span>
          <strong>Modo Suporte:</strong> Você está acessando o restaurante{" "}
          <span className="font-bold underline decoration-current/40">
            {impersonation.targetRestaurantName}
          </span>
          . Ações de alteração serão registradas na auditoria.
        </span>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleExit}
        className="border-on-warning/30 bg-canvas text-ink hover:bg-surface"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Sair do modo suporte
      </Button>
    </aside>
  );
}
