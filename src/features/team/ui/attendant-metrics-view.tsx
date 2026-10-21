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
  Star,
  Clock,
  Zap,
  CheckCircle2,
  Users,
} from "lucide-react";
import type { AttendantMetric } from "@/shared/types/api";

type SortField =
  | "username"
  | "totalAttended"
  | "averageReactionTimeSec"
  | "averageExecutionTimeSec"
  | "averageRating";

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
    seconds <= 0
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

function formatRating(rating: number | null | undefined): string {
  if (rating === null || rating === undefined || isNaN(rating) || rating <= 0) {
    return "—";
  }
  return rating.toFixed(1);
}

export function AttendantMetricsView({
  metrics,
  isLoading = false,
}: AttendantMetricsViewProps) {
  const [sortField, setSortField] = React.useState<SortField>("totalAttended");
  const [sortDirection, setSortDirection] =
    React.useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // For reaction and execution time, ascending (faster) is usually the desired first direction
      if (
        field === "averageReactionTimeSec" ||
        field === "averageExecutionTimeSec"
      ) {
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
        const valA = a[sortField] ?? (sortDirection === "asc" ? Infinity : -1);
        const valB = b[sortField] ?? (sortDirection === "asc" ? Infinity : -1);
        comparison = (valA as number) - (valB as number);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [metrics, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
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
        className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
      >
        <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950 dark:text-amber-100">
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
          icon={<Users className="h-6 w-6 text-zinc-500" />}
          title="Nenhum atendimento registrado"
          description="Assim que os garçons assumirem e concluírem chamados pelo painel, os dados de desempenho serão consolidados aqui."
        />
      ) : (
        <>
          {/* Seletor de ordenação rápido no Mobile */}
          <div className="flex flex-col gap-2 md:hidden">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Ordenar por:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSort("totalAttended")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "totalAttended"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Mais Atendidos
              </button>
              <button
                type="button"
                onClick={() => handleSort("averageReactionTimeSec")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "averageReactionTimeSec"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Reação Rápida
              </button>
              <button
                type="button"
                onClick={() => handleSort("averageRating")}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  sortField === "averageRating"
                    ? "bg-orange-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                Melhor Nota
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
                      className="group flex items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span>Garçom</span>
                      {renderSortIcon("username")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[160px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("totalAttended")}
                      className="group ml-auto flex items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span>Atendimentos</span>
                      {renderSortIcon("totalAttended")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("averageReactionTimeSec")}
                      className="group ml-auto flex items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span>Tempo de Reação</span>
                      {renderSortIcon("averageReactionTimeSec")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[180px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("averageExecutionTimeSec")}
                      className="group ml-auto flex items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span>Tempo de Execução</span>
                      {renderSortIcon("averageExecutionTimeSec")}
                    </button>
                  </TableHead>
                  <TableHead className="w-[150px] text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("averageRating")}
                      className="group ml-auto flex items-center font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <span>Avaliação Média</span>
                      {renderSortIcon("averageRating")}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMetrics.map((attendant) => (
                  <TableRow key={attendant.userId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {attendant.username}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="neutral" size="sm" className="font-mono">
                        {attendant.totalAttended} chamados
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {formatDuration(attendant.averageReactionTimeSec)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-zinc-700 dark:text-zinc-300">
                      {formatDuration(attendant.averageExecutionTimeSec)}
                    </TableCell>
                    <TableCell className="text-right">
                      {attendant.averageRating ? (
                        <div className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          <span>{formatRating(attendant.averageRating)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 dark:text-zinc-600">
                          —
                        </span>
                      )}
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
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                    {attendant.username}
                  </h4>
                  <Badge variant="neutral" size="sm" className="font-mono">
                    <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                    {attendant.totalAttended} atendidos
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span>Reação</span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {formatDuration(attendant.averageReactionTimeSec)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>Execução</span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {formatDuration(attendant.averageExecutionTimeSec)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-500">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span>Nota</span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {formatRating(attendant.averageRating)}
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
