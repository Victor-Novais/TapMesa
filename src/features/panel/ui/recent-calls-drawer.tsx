"use client";

import * as React from "react";
import {
  History,
  CheckCircle2,
  Clock,
  Hourglass,
  Star,
  RefreshCw,
  Bell,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import type { RecentAttendedCallDto } from "@/shared/types/api";

export interface RecentCallsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentCalls: RecentAttendedCallDto[];
  onRefresh: () => void;
  isLoading?: boolean;
}

function formatAttendedTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function formatDurationSec(seconds: number | null): string {
  if (!seconds || seconds <= 0) return "< 1 min";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function RecentCallsDrawer({
  open,
  onOpenChange,
  recentCalls,
  onRefresh,
  isLoading = false,
}: RecentCallsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        position="right"
        className="w-full sm:max-w-md p-6 flex flex-col h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Chamados Recentes
              </h3>
              <p className="text-xs text-zinc-500">
                Últimos atendimentos e avaliações do cliente
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-10 w-10 min-h-[44px] min-w-[44px] p-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Atualizar lista de recentes"
            title="Atualizar lista"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                isLoading && "animate-spin text-orange-600",
              )}
            />
          </Button>
        </div>

        {/* List of Recent Attended Calls */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
          {recentCalls.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <History className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Nenhum chamado atendido ainda
              </p>
              <p className="mt-1 text-xs text-zinc-500 max-w-xs">
                Assim que a equipe clicar em &ldquo;Atendido&rdquo;, o histórico
                e status de confirmação aparecerão aqui.
              </p>
            </div>
          ) : (
            recentCalls.map((call) => {
              const formattedTime = formatAttendedTime(call.attendedAt);
              const durationStr = formatDurationSec(call.executionTimeSec);

              const isConfirmed = call.confirmationStatus === "CONFIRMED";
              const isClosed = call.confirmationStatus === "CLOSED_UNCONFIRMED";
              const isContested = call.confirmationStatus === "CONTESTED";

              return (
                <div
                  key={call.id}
                  className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4 transition-[background-color,border-color] duration-150 ease-out dark:border-zinc-800 dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                >
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                        Mesa {call.tableNumber}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        {call.type === "WAITER" ? (
                          <>
                            <Bell className="h-3.5 w-3.5 text-orange-600" />
                            Garçom
                          </>
                        ) : (
                          <>
                            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                            Conta
                          </>
                        )}
                      </span>
                    </div>

                    {formattedTime && (
                      <span className="text-xs font-mono text-zinc-500">
                        {formattedTime}
                      </span>
                    )}
                  </div>

                  {/* Confirmation Status */}
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center gap-1.5">
                      {isConfirmed ? (
                        <Badge
                          variant="success"
                          className="flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Confirmado</span>
                        </Badge>
                      ) : isContested ? (
                        <Badge
                          variant="danger"
                          className="flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Contestado</span>
                        </Badge>
                      ) : isClosed ? (
                        <Badge
                          variant="neutral"
                          className="flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Encerrado</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="alert"
                          className="flex items-center gap-1 text-[11px] font-semibold animate-pulse"
                        >
                          <Hourglass className="h-3 w-3" />
                          <span>Aguardando cliente</span>
                        </Badge>
                      )}

                      {call.rating && (
                        <span className="flex items-center gap-0.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span>{call.rating}/3</span>
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-zinc-500">
                      {durationStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-400">
            Mostrando até 15 atendimentos mais recentes
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
