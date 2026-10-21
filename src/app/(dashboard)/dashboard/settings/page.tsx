import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { Card } from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Configurações",
  description:
    "Parâmetros de atendimento, aparência e notificações do restaurante",
};

export default function SettingsOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configurações do Restaurante
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajuste limites de tempo de alerta e urgência, identidade visual,
          logotipo e notificações.
        </p>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <Settings className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Módulo de Configurações
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          Regras de atendimento (F16), personalização de aparência com pré-via
          ao vivo (F17) e notificações por e-mail (F18) serão configuradas
          nestas seções.
        </p>
      </Card>
    </div>
  );
}
