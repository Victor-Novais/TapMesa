"use client";

import * as React from "react";
import {
  Bell,
  Receipt,
  Clock,
  UserCheck,
  AlertTriangle,
  Flame,
  RefreshCw,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  usePanelStore,
  usePanelStream,
  usePanelActions,
} from "@/features/panel";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useNow, calculateElapsedSec, formatTimer } from "@/shared/lib/clock";
import { cn } from "@/shared/lib/cn";

function getAlertLevel(
  elapsedSec: number,
  alertSec: number,
  urgentSec: number,
): {
  level: "normal" | "alert" | "urgent";
  label: string;
  badgeVariant: "success" | "alert" | "danger";
  icon: React.ReactNode;
} {
  if (elapsedSec >= urgentSec) {
    return {
      level: "urgent",
      label: "Urgente",
      badgeVariant: "danger",
      icon: <Flame className="h-3.5 w-3.5 animate-pulse" />,
    };
  }
  if (elapsedSec >= alertSec) {
    return {
      level: "alert",
      label: "Alerta",
      badgeVariant: "alert",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }
  return {
    level: "normal",
    label: "Normal",
    badgeVariant: "success",
    icon: <Clock className="h-3.5 w-3.5" />,
  };
}

export default function PanelOperationalPage() {
  // Inicia conexão SSE do painel com ticket de uso único
  const { isPollingFallback, reconnect } = usePanelStream();

  const { calls, recent, counters, thresholds } = usePanelStore();
  const { assumeCall, attendCall, loadRecent, isLoadingRecent, isSubmitting } =
    usePanelActions();

  // Assina o tick do relógio compartilhado para atualização dos cronômetros
  useNow();

  React.useEffect(() => {
    void loadRecent(15);
  }, [loadRecent]);

  return (
    <div className="space-y-6">
      {/* Contingency Polling Warning Banner */}
      {isPollingFallback && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold">
              Conexão SSE instável. Operando em modo de contingência com
              atualização a cada 10s.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={reconnect}
            className="h-7 text-xs border-amber-300 bg-white hover:bg-amber-100 dark:border-amber-700 dark:bg-zinc-900"
          >
            Tentar reconectar SSE
          </Button>
        </div>
      )}

      {/* Counters Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500 font-medium">Total Ativos</p>
          <p className="mt-1 text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            {counters.activeCallsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <Bell className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Chamados Garçom</p>
          </div>
          <p className="mt-1 text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            {counters.waiterCallsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-3.5 w-3.5" />
            <p className="text-xs font-medium">Pedidos de Conta</p>
          </div>
          <p className="mt-1 text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            {counters.billCallsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">Recentes</p>
            <button
              type="button"
              onClick={() => void loadRecent(15)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Recarregar recentes"
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  isLoadingRecent && "animate-spin text-orange-500",
                )}
              />
            </button>
          </div>
          <p className="mt-1 text-3xl font-extrabold font-mono text-zinc-900 dark:text-zinc-50">
            {recent.length}
          </p>
        </div>
      </div>

      {/* Active Calls Operational Queue */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Fila Operacional</span>
            <Badge variant="neutral" className="font-mono text-xs">
              {calls.length}
            </Badge>
          </h2>
          <span className="text-xs text-zinc-500 font-medium">
            Ordenado do mais antigo para o mais recente
          </span>
        </div>

        {calls.length === 0 ? (
          <Card className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center border-dashed">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Tudo em dia no salão!
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-zinc-500 max-w-sm">
              Não há chamados de garçom ou pedidos de conta aguardando
              atendimento.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {calls.map((call) => {
              const elapsedSec = calculateElapsedSec(call.createdAt);
              const timerStr = formatTimer(elapsedSec);
              const alert = getAlertLevel(
                elapsedSec,
                thresholds.alertSec,
                thresholds.urgentSec,
              );
              const isAssumed = Boolean(call.acknowledgedAt);
              const submitting = isSubmitting(call.id);

              return (
                <div
                  key={call.id}
                  className={cn(
                    "flex flex-col justify-between rounded-3xl border bg-white p-5 shadow-sm transition-all dark:bg-zinc-900",
                    alert.level === "urgent"
                      ? "border-red-400/80 ring-2 ring-red-400/30 dark:border-red-600"
                      : alert.level === "alert"
                        ? "border-amber-400/80 ring-2 ring-amber-400/30 dark:border-amber-600"
                        : "border-zinc-200 dark:border-zinc-800",
                  )}
                >
                  <div className="space-y-3">
                    {/* Top Table & Alert badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                        Mesa {call.tableNumber}
                      </span>
                      <Badge
                        variant={alert.badgeVariant}
                        className="flex items-center gap-1 font-semibold text-xs"
                      >
                        {alert.icon}
                        <span>{alert.label}</span>
                      </Badge>
                    </div>

                    {/* Type and Wait Time */}
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        {call.type === "WAITER" ? (
                          <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                            <Bell className="h-4 w-4" />
                            Garçom
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <Receipt className="h-4 w-4" />
                            Conta
                          </span>
                        )}
                        {call.reopenCount > 0 && (
                          <Badge
                            variant="alert"
                            className="text-[10px] px-1.5 py-0.2"
                          >
                            Reaberto ({call.reopenCount}x)
                          </Badge>
                        )}
                      </div>

                      <div className="font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                        {timerStr}
                      </div>
                    </div>

                    {/* Note if provided */}
                    {call.note && (
                      <div className="flex items-start gap-2 rounded-xl bg-zinc-50 p-2.5 text-xs text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span className="italic break-words">
                          &ldquo;{call.note}&rdquo;
                        </span>
                      </div>
                    )}

                    {/* Assumed status */}
                    {isAssumed && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Assumido pela equipe</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Assumir e Atender */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAssumed || submitting}
                      isLoading={submitting && !isAssumed}
                      onClick={() => void assumeCall(call.id)}
                      className="text-xs font-semibold"
                    >
                      {isAssumed ? "Assumido" : "Assumir"}
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      disabled={submitting}
                      isLoading={submitting}
                      onClick={() => void attendCall(call.id)}
                      className="text-xs font-bold"
                    >
                      Atendido
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recently Attended Drawer/Section */}
      <section className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Últimos Atendidos</span>
            <Badge variant="neutral" className="font-mono text-xs">
              {recent.length}
            </Badge>
          </h2>
        </div>

        {recent.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            Nenhum chamado atendido recentemente.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {recent.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm text-xs dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Mesa {r.tableNumber}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    {r.type === "WAITER" ? "Garçom" : "Conta"}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <Badge
                    variant={
                      r.status === "CONFIRMED"
                        ? "success"
                        : r.status === "CLOSED_UNCONFIRMED"
                          ? "neutral"
                          : "alert"
                    }
                    className="text-[10px]"
                  >
                    {r.status === "CONFIRMED"
                      ? "Confirmado"
                      : r.status === "CLOSED_UNCONFIRMED"
                        ? "Encerrado"
                        : "Aguardando"}
                  </Badge>

                  {r.rating && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ★ {r.rating}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
