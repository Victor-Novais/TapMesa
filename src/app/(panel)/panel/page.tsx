import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Painel de Atendimento",
  description: "Fila operacional de chamados de garçom e pedidos de conta",
};

export default function PanelOperationalPage() {
  return (
    <div className="space-y-4">
      {/* Quick stats / summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 font-medium">Chamados Ativos</p>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 font-medium">Garçom</p>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 font-medium">Conta / Pagamento</p>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 font-medium">Atendidos Hoje</p>
          <p className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-50">
            0
          </p>
        </div>
      </div>

      {/* Main operational queue placeholder */}
      <Card className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center border-dashed">
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <Bell className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Nenhum chamado pendente no momento
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm">
          A fila em tempo real com SSE, avisos sonoros e síntese de voz será
          conectada nas tarefas F09 a F11.
        </p>
      </Card>
    </div>
  );
}
