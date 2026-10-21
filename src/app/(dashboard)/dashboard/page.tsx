import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";

export const metadata: Metadata = {
  title: "Resumo",
  description: "Visão geral da operação e métricas do restaurante",
};

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Resumo Operacional
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Acompanhe em tempo real o volume de chamados, tempo de resposta e
            equipe ativa.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chamados Hoje</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-400">
              Nenhum chamado registrado hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tempo Médio Reação</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">
              --:--
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-400">Meta: 60s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avaliação Média</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">--</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-400">Baseado nas confirmações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mesas Ativas</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">0</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-400">Total cadastradas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Ambiente pronto para operação
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          As métricas detalhadas, gráficos por hora e ranking de atendentes
          serão implementados na tarefa F14.
        </p>
      </Card>
    </div>
  );
}
