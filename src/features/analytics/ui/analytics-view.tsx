"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  useServiceSettingsQuery,
  useAnalyticsSummaryQuery,
  useAnalyticsCompareQuery,
  useAnalyticsByHourQuery,
  useTablesRankingQuery,
  useAnalyticsCallsQuery,
} from "../api/use-analytics-queries";
import {
  getDatePresets,
  getOperationalDateString,
  isTodayIncluded,
  type DatePreset,
  type DateRange,
} from "../lib/operational-date";
import { PeriodSelector } from "./period-selector";
import { AnalyticsKpis } from "./analytics-kpis";
import { TablesRanking } from "./tables-ranking";
import { CallsTable, type CallsTableFilters } from "./calls-table";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Button } from "@/shared/ui/button";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";

const HourlyChart = dynamic(
  () => import("./hourly-chart").then((mod) => mod.HourlyChart),
  {
    loading: () => (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

export function AnalyticsView() {
  const { data: serviceSettings } = useServiceSettingsQuery();

  const timezone = serviceSettings?.timezone || "America/Sao_Paulo";
  const dayCutoffHour = serviceSettings?.dayCutoffHour ?? 5;
  const responseGoalSec = serviceSettings?.responseGoalSec ?? 60;

  // Presets calculados com base no fuso e corte do restaurante
  const presets = React.useMemo(() => {
    return getDatePresets(timezone, dayCutoffHour);
  }, [timezone, dayCutoffHour]);

  const [preset, setPreset] = React.useState<DatePreset>("today");
  const [range, setRange] = React.useState<DateRange>(() => {
    const today = getOperationalDateString(new Date(), timezone, dayCutoffHour);
    return { from: today, to: today };
  });

  const [callsCursor, setCallsCursor] = React.useState<string | null>(null);
  const [callsFilters, setCallsFilters] = React.useState<CallsTableFilters>({});

  const handleCallsFiltersChange = (filters: CallsTableFilters) => {
    setCallsFilters(filters);
    setCallsCursor(null);
  };

  // Sincroniza o range quando o preset mudar ou os presets forem recalculados
  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      setRange(presets[newPreset]);
      setCallsCursor(null);
    }
  };

  const handleCustomRangeChange = (newRange: DateRange) => {
    setRange(newRange);
    setCallsCursor(null);
  };

  const isLive = React.useMemo(() => {
    return isTodayIncluded(range.from, range.to, timezone, dayCutoffHour);
  }, [range, timezone, dayCutoffHour]);

  const isTodayOnly = React.useMemo(() => {
    const today = getOperationalDateString(new Date(), timezone, dayCutoffHour);
    return range.from === today && range.to === today;
  }, [range, timezone, dayCutoffHour]);

  // Consultas de dados analíticos
  const summaryQuery = useAnalyticsSummaryQuery(range.from, range.to, isLive);
  const compareQuery = useAnalyticsCompareQuery();
  const byHourQuery = useAnalyticsByHourQuery(range.from, range.to, isLive);
  const rankingQuery = useTablesRankingQuery(range.from, range.to, isLive);
  const callsQuery = useAnalyticsCallsQuery(callsCursor, 20, {
    ...callsFilters,
    from: range.from,
    to: range.to,
  });

  const isLoading = summaryQuery.isLoading || byHourQuery.isLoading;
  const isError = summaryQuery.isError || byHourQuery.isError;

  const handleRefetchAll = () => {
    summaryQuery.refetch();
    compareQuery.refetch();
    byHourQuery.refetch();
    rankingQuery.refetch();
    callsQuery.refetch();
  };

  const overview = summaryQuery.data?.summary?.overview;

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Resumo Operacional
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Acompanhe o volume de chamados, tempo de resposta, satisfação e
            equipe ativa.
          </p>
        </div>
      </div>

      {/* Seletor de Período e Exportação de Relatório */}
      <PeriodSelector
        preset={preset}
        range={range}
        isLive={isLive}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
      />

      {/* Estados: Carregando, Erro ou Conteúdo */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-950/60 dark:bg-red-950/20">
          <AlertCircle className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
          <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Não foi possível carregar as métricas operacionais
          </h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
            Verifique sua conexão ou tente recarregar os dados.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetchAll}
            className="mt-4 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar métricas
          </Button>
        </div>
      ) : !overview || overview.totalCalls === 0 ? (
        /* Estado Sem Dados no Período Selecionado */
        <div className="space-y-6">
          {/* Mostra KPIs zerados de forma limpa */}
          {overview && (
            <AnalyticsKpis
              overview={overview}
              compare={compareQuery.data}
              isToday={isTodayOnly}
              responseGoalSec={responseGoalSec}
            />
          )}

          <EmptyState
            icon={
              <LayoutDashboard className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            }
            title="Nenhum chamado no período selecionado"
            description="Não foram registrados atendimentos ou pedidos de conta no intervalo escolhido. Alterne o filtro para consultar outros dias."
          />
        </div>
      ) : (
        /* Visualização Completa de Dados Analíticos */
        <div className="space-y-6">
          {/* 1. KPIs / StatCards */}
          <AnalyticsKpis
            overview={overview}
            compare={compareQuery.data}
            isToday={isTodayOnly}
            responseGoalSec={responseGoalSec}
          />

          {/* 2. Gráfico de Chamados por Hora (com tabela acessível) */}
          <HourlyChart hourly={byHourQuery.data?.byHour || []} />

          {/* 3. Ranking de Mesas */}
          <TablesRanking rankingData={rankingQuery.data} />

          {/* 4. Tabela Detalhada de Chamados com Paginação por Cursor */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Histórico Detalhado de Chamados
            </h3>
            <CallsTable
              calls={callsQuery.data?.items || []}
              totalCount={callsQuery.data?.totalCount}
              nextCursor={callsQuery.data?.nextCursor}
              isFirstPage={callsCursor === null}
              onPageChange={(cursor) => setCallsCursor(cursor)}
              filters={callsFilters}
              onFiltersChange={handleCallsFiltersChange}
              isLoading={callsQuery.isLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
