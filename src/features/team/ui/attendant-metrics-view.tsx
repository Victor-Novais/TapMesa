"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/data-table";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  Hourglass,
  CheckCircle2,
  Users,
} from "lucide-react";
import type { AttendantMetric } from "@/shared/types/api";

type SortField =
  | "username"
  | "totalCallsAttended"
  | "avgResponseTimeSec"
  | "fastestResponseSec"
  | "slowestResponseSec";

type SortDirection = "asc" | "desc";

export interface AttendantMetricsViewProps {
  metrics: AttendantMetric[];
  isLoading?: boolean;
}

function formatDuration(seconds: number | null | undefined): string {
  if (
    seconds === null ||
    seconds === undefined ||
    isNaN(seconds) ||
    seconds < 0
  ) {
    return "—";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function AttendantMetricsView({
  metrics,
  isLoading = false,
}: AttendantMetricsViewProps) {
  const [sortField, setSortField] =
    React.useState<SortField>("totalCallsAttended");
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Para tempos, o crescente (mais rápido primeiro) é a direção inicial desejada
      if (field !== "username" && field !== "totalCallsAttended") {
        setSortDirection("asc");
      } else {
        setSortDirection("desc");
      }
    }
  };

  const sortedMetrics = React.useMemo(() => {
    return [...metrics].sort((a, b) => {
      let comparison = 0;
      if (sortField === "username") {
        comparison = a.username.localeCompare(b.username, "pt-BR");
      } else {
        comparison = a[sortField] - b[sortField];
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [metrics, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-ink-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary-ink" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary-ink" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-card" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-control" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Nota de Uso Responsável das Métricas */}
      <div
        role="region"
        aria-label="Nota de uso responsável das métricas"
        className="flex items-start gap-3 rounded-card border border-warning/40 bg-warning-tint p-4 text-xs text-warning-ink"
      >
        <Info className="h-4 w-4 shrink-0 text-warning-ink mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-warning-ink">
            Uso Responsável das Métricas Individuais
          </p>
          <p className="leading-relaxed">
            Estas métricas têm como objetivo identificar oportunidades de apoio
            à equipe e gargalos operacionais no salão. O tempo de resposta varia
            com a lotação, complexidade dos chamados e distância entre mesas.
            Utilize estes dados para reconhecer e capacitar, nunca para
            comparações individuais isoladas ou medidas punitivas.
          </p>
        </div>
      </div>

      {metrics.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-ink-2" />}
          title="Nenhum atendimento registrado"
          description="Assim que os garçons assumirem e concluírem chamados pelo painel, os dados de desempenho serão consolidados aqui."
        />
      ) : (
        <>
          {/* Seletor de ordenação rápido no Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            <span className="text-xs font-semibold text-ink-2">
              Ordenar por:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSort("totalCallsAttended")}
                className={`rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "totalCallsAttended"
                    ? "bg-primary text-white"
                    : "bg-nav text-ink-2 hover:bg-nav"
                }`}
              >
                Mais Atendidos
              </button>
              <button
                type="button"
                onClick={() => handleSort("avgResponseTimeSec")}
                className={`rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "avgResponseTimeSec"
                    ? "bg-primary text-white"
                    : "bg-nav text-ink-2 hover:bg-nav"
                }`}
              >
                Resposta Rápida
              </button>
              <button
                type="button"
                onClick={() => handleSort("slowestResponseSec")}
                className={`rounded-control px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "slowestResponseSec"
                    ? "bg-primary text-white"
                    : "bg-nav text-ink-2 hover:bg-nav"
                }`}
              >
                Maior Espera
              </button>
            </div>
          </div>

          {/* 1. Tabela Desktop / Tablet */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <button
                      type="button"
                      onClick={() => handleSort("username")}
                      className="group flex items-center font-semibold text-ink hover:text-primary-ink"
                    >
                      <span>Garçom</span>
                      {renderSortIcon("username")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("totalCallsAttended")}
                      className="group ml-auto flex items-center font-semibold text-ink hover:text-primary-ink"
                    >
                      <span>Atendimentos</span>
                      {renderSortIcon("totalCallsAttended")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("avgResponseTimeSec")}
                      className="group ml-auto flex items-center font-semibold text-ink hover:text-primary-ink"
                    >
                      <span>Tempo Médio</span>
                      {renderSortIcon("avgResponseTimeSec")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("fastestResponseSec")}
                      className="group ml-auto flex items-center font-semibold text-ink hover:text-primary-ink"
                    >
                      <span>Mais Rápido</span>
                      {renderSortIcon("fastestResponseSec")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[150px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("slowestResponseSec")}
                      className="group ml-auto flex items-center font-semibold text-ink hover:text-primary-ink"
                    >
                      <span>Mais Lento</span>
                      {renderSortIcon("slowestResponseSec")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetrics.map((attendant) => (
                  <TableRow key={attendant.userId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">
                          {attendant.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="neutral"
                        size="sm"
                        className="tabular-nums"
                      >
                        {attendant.totalCallsAttended} chamados
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-ink-2">
                      {formatDuration(attendant.avgResponseTimeSec)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-ink-2">
                      {formatDuration(attendant.fastestResponseSec)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs text-ink-2">
                      {formatDuration(attendant.slowestResponseSec)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 2. Cards no Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {sortedMetrics.map((attendant) => (
              <Card key={attendant.userId} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-ink text-sm">
                    {attendant.username}
                  </h4>
                  <Badge variant="neutral" size="sm" className="tabular-nums">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-success" />
                    {attendant.totalCallsAttended} atendidos
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle text-center">
                  <div className="rounded-control bg-nav p-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-ink-2">
                      <Clock className="h-3 w-3 text-ink-2" />
                      <span>Média</span>
                    </div>
                    <p className="mt-1 tabular-nums text-xs font-bold text-ink">
                      {formatDuration(attendant.avgResponseTimeSec)}
                    </p>
                  </div>

                  <div className="rounded-control bg-nav p-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-ink-2">
                      <Zap className="h-3 w-3 text-warning-ink" />
                      <span>Mais rápido</span>
                    </div>
                    <p className="mt-1 tabular-nums text-xs font-bold text-ink">
                      {formatDuration(attendant.fastestResponseSec)}
                    </p>
                  </div>

                  <div className="rounded-control bg-nav p-2">
                    <div className="flex items-center justify-center gap-1 text-xs text-ink-2">
                      <Hourglass className="h-3 w-3 text-danger-ink" />
                      <span>Mais lento</span>
                    </div>
                    <p className="mt-1 tabular-nums text-xs font-bold text-ink">
                      {formatDuration(attendant.slowestResponseSec)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
