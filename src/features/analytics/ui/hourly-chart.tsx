"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/data-table";
import { BarChart3, Table as TableIcon } from "lucide-react";
import { formatDurationSec } from "../lib/operational-date";
import type { HourlyMetric } from "@/shared/types/api";

export interface HourlyChartProps {
  hourly: HourlyMetric[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    name: string;
    color: string;
  }>;
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const totalCalls =
      payload.find((p) => p.dataKey === "totalCalls")?.value || 0;
    const waitSec =
      payload.find((p) => p.dataKey === "averageWaitSec")?.value || 0;

    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-800 dark:bg-zinc-900 text-xs">
        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Horário: {label}h:00 às {label}h:59
        </p>
        <div className="space-y-1">
          <p className="flex items-center justify-between gap-4 text-orange-600 dark:text-orange-400">
            <span>Volume de chamados:</span>
            <strong className="font-mono">{totalCalls}</strong>
          </p>
          <p className="flex items-center justify-between gap-4 text-zinc-600 dark:text-zinc-400">
            <span>Espera média:</span>
            <strong className="font-mono">{formatDurationSec(waitSec)}</strong>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export function HourlyChart({ hourly }: HourlyChartProps) {
  const [showTable, setShowTable] = React.useState(false);

  // Formata os dados para o gráfico com horas ordenadas (0 a 23)
  const chartData = React.useMemo(() => {
    return hourly.map((h) => ({
      hour: h.hour,
      hourLabel: `${String(h.hour).padStart(2, "0")}h`,
      totalCalls: h.totalCalls,
      averageWaitSec: h.averageWaitSec,
    }));
  }, [hourly]);

  const hasData = chartData.some((h) => h.totalCalls > 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-2">
        <div>
          <CardTitle className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span>Distribuição de Chamados por Hora</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
            Identifique os horários de pico e gargalos de atendimento no salão
          </CardDescription>
        </div>

        {/* Alternância Acessível: Gráfico / Tabela */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTable((prev) => !prev)}
          className="gap-1.5 text-xs h-8"
          aria-label={
            showTable
              ? "Exibir gráfico interativo"
              : "Exibir tabela de dados alternativa"
          }
        >
          {showTable ? (
            <>
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Ver Gráfico</span>
            </>
          ) : (
            <>
              <TableIcon className="h-3.5 w-3.5" />
              <span>Ver Tabela Acessível</span>
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent className="pt-4">
        {!hasData ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 text-center dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500">
              Nenhum chamado registrado nas horas deste período.
            </p>
          </div>
        ) : showTable ? (
          /* Tabela Acessível para Leitores de Tela e Conformidade WCAG AA */
          <div className="max-h-72 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead className="text-right">
                    Total de Chamados
                  </TableHead>
                  <TableHead className="text-right">
                    Tempo Médio de Espera
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row) => (
                  <TableRow key={row.hour}>
                    <TableCell className="font-mono font-medium">
                      {row.hourLabel}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {row.totalCalls}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatDurationSec(row.averageWaitSec)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Gráfico Recharts Responsivo */
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e4e4e7"
                  className="dark:stroke-zinc-800"
                />
                <XAxis
                  dataKey="hourLabel"
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e4e4e7" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#71717a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                />
                <Bar
                  dataKey="totalCalls"
                  name="Total de Chamados"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
