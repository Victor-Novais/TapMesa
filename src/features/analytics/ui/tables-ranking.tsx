"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { formatDurationSec } from "../lib/operational-date";
import { Flame, Clock } from "lucide-react";
import type { TablesRankingResponse } from "@/shared/types/api";

export interface TablesRankingProps {
  rankingData?: TablesRankingResponse | null;
}

export function TablesRanking({ rankingData }: TablesRankingProps) {
  const byVolume = React.useMemo(
    () => rankingData?.ranking.all.byVolume ?? [],
    [rankingData?.ranking.all.byVolume],
  );
  // Ordenado pela API do maior para o menor tempo médio de resposta
  const byResponseTime = React.useMemo(
    () => rankingData?.ranking.all.byResponseTime ?? [],
    [rankingData?.ranking.all.byResponseTime],
  );

  const maxVolume = React.useMemo(() => {
    return Math.max(1, ...byVolume.map((t) => t.totalCalls));
  }, [byVolume]);

  const maxWait = React.useMemo(() => {
    return Math.max(1, ...byResponseTime.map((t) => t.averageResponseTimeSec));
  }, [byResponseTime]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Ranking por Volume de Chamados */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>Mesas com Maior Volume</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Mesas que mais solicitaram atendimentos ou pedidos de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {byVolume.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              Nenhuma mesa registrada no período.
            </p>
          ) : (
            byVolume.slice(0, 5).map((item, index) => {
              const percentage = Math.round(
                (item.totalCalls / maxVolume) * 100,
              );

              return (
                <div key={item.tableNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[11px] ${
                          index === 0
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : index === 1
                              ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                              : index === 2
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        Mesa {item.tableNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {item.totalCalls}{" "}
                        <span className="font-sans font-normal text-zinc-400 text-[11px]">
                          chamados
                        </span>
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        (espera {formatDurationSec(item.averageResponseTimeSec)}
                        )
                      </span>
                    </div>
                  </div>

                  {/* Barra proporcional */}
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-orange-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 2. Ranking por Maior Tempo de Espera */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Mesas com Maior Espera</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Mesas que enfrentaram os maiores tempos médios até o atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {byResponseTime.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              Nenhuma mesa registrada no período.
            </p>
          ) : (
            byResponseTime.slice(0, 5).map((item, index) => {
              const percentage = Math.round(
                (item.averageResponseTimeSec / maxWait) * 100,
              );

              return (
                <div key={item.tableNumber} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md font-mono text-[11px] ${
                          index === 0
                            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100">
                        Mesa {item.tableNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {formatDurationSec(item.averageResponseTimeSec)}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        ({item.totalCalls}{" "}
                        <span className="font-sans font-normal">ch.</span>)
                      </span>
                    </div>
                  </div>

                  {/* Barra proporcional */}
                  <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
