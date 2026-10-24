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
          <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
            <Flame className="h-4 w-4 text-primary-ink" />
            <span>Mesas com Maior Volume</span>
          </CardTitle>
          <CardDescription className="text-xs text-ink-2">
            Mesas que mais solicitaram atendimentos ou pedidos de conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {byVolume.length === 0 ? (
            <p className="text-xs text-ink-2 py-6 text-center">
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
                        className={`flex h-5 w-5 items-center justify-center rounded-chip tabular-nums text-xs ${
                          index === 0
                            ? "bg-warning-tint text-warning-ink"
                            : index === 1
                              ? "bg-nav text-ink"
                              : index === 2
                                ? "bg-brand-tint text-primary-ink"
                                : "bg-nav text-ink-2"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-ink">Mesa {item.tableNumber}</span>
                    </div>

                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-ink">
                        {item.totalCalls}{" "}
                        <span className="font-sans font-normal text-ink-2 text-xs">
                          chamados
                        </span>
                      </span>
                      <span className="text-ink-2 text-xs">
                        (espera {formatDurationSec(item.averageResponseTimeSec)}
                        )
                      </span>
                    </div>
                  </div>

                  {/* Barra proporcional */}
                  <div className="h-2 w-full rounded-full bg-nav overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out-soft"
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
          <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
            <Clock className="h-4 w-4 text-ink-2" />
            <span>Mesas com Maior Espera</span>
          </CardTitle>
          <CardDescription className="text-xs text-ink-2">
            Mesas que enfrentaram os maiores tempos médios até o atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {byResponseTime.length === 0 ? (
            <p className="text-xs text-ink-2 py-6 text-center">
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
                        className={`flex h-5 w-5 items-center justify-center rounded-chip tabular-nums text-xs ${
                          index === 0
                            ? "bg-danger-tint text-danger-ink"
                            : "bg-nav text-ink-2"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-ink">Mesa {item.tableNumber}</span>
                    </div>

                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-danger-ink font-bold">
                        {formatDurationSec(item.averageResponseTimeSec)}
                      </span>
                      <span className="text-ink-2 text-xs">
                        ({item.totalCalls}{" "}
                        <span className="font-sans font-normal">ch.</span>)
                      </span>
                    </div>
                  </div>

                  {/* Barra proporcional */}
                  <div className="h-2 w-full rounded-full bg-nav overflow-hidden">
                    <div
                      className="h-full rounded-full bg-danger transition-[width] duration-300 ease-out-soft"
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
