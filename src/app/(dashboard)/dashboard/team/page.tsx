import type { Metadata } from "next";
import { Users } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Equipe",
  description: "Gestão da equipe de atendentes e garçons",
};

export default function TeamOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Equipe e Atendentes
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Gerencie acessos dos garçons, redefina senhas temporárias e consulte
          métricas individuais.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Módulo de Equipe
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          Cadastro de usuários, reset seguro de senhas temporárias e histórico
          de atendimento serão ativados na tarefa F15.
        </p>
      </Card>
    </div>
  );
}
