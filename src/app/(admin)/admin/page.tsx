import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Restaurantes",
  description: "Gestão global de restaurantes no TapMesa Admin",
};

export default function AdminRestaurantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Restaurantes Cadastrados
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Visão geral de todos os restaurantes da plataforma, controle de status
          e modo suporte.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
          <Building2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Gestão Central de Estabelecimentos
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          Criação de novos restaurantes, suspensão, reativação e impersonação de
          suporte serão integrados na tarefa F19.
        </p>
      </Card>
    </div>
  );
}
