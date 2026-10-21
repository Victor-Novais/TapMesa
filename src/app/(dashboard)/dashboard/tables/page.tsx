import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Mesas",
  description: "Gestão de mesas, status e impressão de QR Codes",
};

export default function TablesOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Gestão de Mesas
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Cadastre novas mesas, visualize QR Codes e pause atendimentos
          temporariamente.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <QrCode className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Módulo de Mesas
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          Criação de mesas individuais, lote automático e impressão em folha A4
          serão integrados na tarefa F12 e F13.
        </p>
      </Card>
    </div>
  );
}
