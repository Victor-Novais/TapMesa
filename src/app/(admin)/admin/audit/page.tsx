import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Auditoria",
  description: "Trilha global e imutável de auditoria administrativa",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Trilha de Auditoria
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Registro imutável de todas as ações administrativas, mutações em
          suporte e alterações sensíveis.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <ScrollText className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Logs de Auditoria
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          Filtros por restaurante, ator, método e consulta de metadados de
          impersonação serão ativados na tarefa F19.
        </p>
      </Card>
    </div>
  );
}
