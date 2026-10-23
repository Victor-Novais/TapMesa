"use client";

import * as React from "react";
import { StatCard } from "@/shared/ui/stat-card";
import { formatDurationSec } from "../lib/operational-date";
import type {
  AnalyticsSummaryOverview,
  AnalyticsCompareResponse,
} from "@/shared/types/api";
import {
  BellRing,
  CheckCircle2,
  Clock,
  Star,
  Timer,
  AlertTriangle,
  Target,
} from "lucide-react";

export interface AnalyticsKpisProps {
  overview: AnalyticsSummaryOverview;
  compare?: AnalyticsCompareResponse | null;
  isToday: boolean;
  responseGoalSec?: number;
}

export function AnalyticsKpis({
  overview,
  compare,
  isToday,
  responseGoalSec = 60,
}: AnalyticsKpisProps) {
  // Taxa de atendimento
  const completionRate =
    overview.totalCalls > 0
      ? Math.round((overview.attendedCount / overview.totalCalls) * 100)
      : 0;

  // % dentro da meta
  const withinTargetRate = overview.percentageWithinTarget ?? 0;
  const isWithinTargetGoalMet = withinTargetRate >= 85;

  // Variações comparativas com o dia anterior (exibidas somente quando visualizando Hoje).
  // A API devolve os dois dias; a variação percentual é calculada aqui.
  const todayOverview = compare?.today.metrics.overview;
  const yesterdayOverview = compare?.yesterday.metrics.overview;
  const callsDiffPercent =
    todayOverview && yesterdayOverview && yesterdayOverview.totalCalls > 0
      ? ((todayOverview.totalCalls - yesterdayOverview.totalCalls) /
          yesterdayOverview.totalCalls) *
        100
      : null;
  const avgToday = todayOverview?.responseTimes.averageResponseTimeSec ?? 0;
  const avgYesterday =
    yesterdayOverview?.responseTimes.averageResponseTimeSec ?? 0;
  const responseTimeDiffPercent =
    avgYesterday > 0 ? ((avgToday - avgYesterday) / avgYesterday) * 100 : null;

  const callsVariation =
    isToday && callsDiffPercent !== null
      ? {
          value: Math.round(callsDiffPercent),
          label: "vs ontem",
        }
      : undefined;

  const responseTimeVariation =
    isToday && responseTimeDiffPercent !== null
      ? {
          // Em tempo de resposta, redução é positivo (invertemos para indicador verde de redução)
          value: -Math.round(responseTimeDiffPercent),
          label: "vs ontem",
        }
      : undefined;

  // Avaliação média formatada
  const ratingAvgDisplay = overview.ratings?.average
    ? `${overview.ratings.average.toFixed(1)} / 3.0`
    : "--";

  const totalProblematic = overview.cancelledCount + overview.expiredCount;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total de Chamados */}
      <StatCard
        title="Total de Chamados"
        value={overview.totalCalls}
        variation={callsVariation}
        description={`${overview.waiterCalls || 0} Garçom · ${
          overview.billCalls || 0
        } Conta`}
        icon={
          <BellRing className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        }
      />

      {/* 2. Chamados Atendidos */}
      <StatCard
        title="Chamados Atendidos"
        value={overview.attendedCount}
        goalStatus={completionRate >= 85 ? "met" : "neutral"}
        goalLabel={`${completionRate}% atendidos`}
        description={`${Math.round(overview.confirmationRate)}% confirmados pelo cliente · ${overview.reopenedCount} reabertos`}
        icon={
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        }
      />

      {/* 3. Tempo Médio de Resposta */}
      <StatCard
        title="Tempo Médio de Espera"
        value={formatDurationSec(
          overview.responseTimes?.averageResponseTimeSec,
        )}
        variation={responseTimeVariation}
        goalStatus={
          overview.responseTimes?.averageResponseTimeSec !== undefined
            ? overview.responseTimes.averageResponseTimeSec <= responseGoalSec
              ? "met"
              : "unmet"
            : undefined
        }
        goalLabel={`Meta: ${responseGoalSec}s`}
        description={`Mediana: ${formatDurationSec(
          overview.responseTimes?.medianResponseTimeSec,
        )}`}
        icon={<Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
      />

      {/* 4. % Dentro da Meta */}
      <StatCard
        title="% Dentro da Meta"
        value={`${withinTargetRate.toFixed(1)}%`}
        goalStatus={isWithinTargetGoalMet ? "met" : "unmet"}
        goalLabel={isWithinTargetGoalMet ? "Na meta" : "Abaixo da meta"}
        description={`Chamados atendidos em até ${responseGoalSec}s`}
        icon={
          <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        }
      />

      {/* 5. Percentil 90 (P90) */}
      <StatCard
        title="Percentil 90 (P90)"
        value={formatDurationSec(overview.responseTimes?.p90ResponseTimeSec)}
        description={`Maior espera: ${formatDurationSec(
          overview.responseTimes?.maxWaitTimeSec,
        )}`}
        icon={<Clock className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />}
      />

      {/* 6. Cancelados e Expirados */}
      <StatCard
        title="Cancelados / Expirados"
        value={totalProblematic}
        goalStatus={totalProblematic > 0 ? "unmet" : "met"}
        goalLabel={totalProblematic > 0 ? "Atenção" : "Zero perdas"}
        description={`${overview.cancelledCount} cancelados · ${overview.expiredCount} expirados`}
        icon={
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        }
      />

      {/* 7. Satisfação do Cliente */}
      <StatCard
        title="Avaliação Média"
        value={ratingAvgDisplay}
        goalStatus={
          overview.ratings?.average && overview.ratings.average >= 2.5
            ? "met"
            : "neutral"
        }
        goalLabel={
          overview.ratings?.total
            ? `${overview.ratings.total} avaliados`
            : "Sem avaliações"
        }
        description="Nota de 1 (Ruim) a 3 (Bom)"
        icon={<Star className="h-4 w-4 text-yellow-500" />}
      />

      {/* 8. Mediana de Espera */}
      <StatCard
        title="Mediana de Atendimento"
        value={formatDurationSec(overview.responseTimes?.medianResponseTimeSec)}
        description="Tempo típico de resposta da equipe"
        icon={
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        }
      />
    </div>
  );
}
