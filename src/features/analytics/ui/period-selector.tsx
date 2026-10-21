"use client";

import * as React from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Download } from "lucide-react";
import { downloadAuthenticated, analyticsApi } from "@/shared/api";
import { useToast } from "@/shared/ui/toast";
import type { DatePreset, DateRange } from "../lib/operational-date";

export interface PeriodSelectorProps {
  preset: DatePreset;
  range: DateRange;
  isLive: boolean;
  onPresetChange: (preset: DatePreset) => void;
  onCustomRangeChange: (range: DateRange) => void;
}

export function PeriodSelector({
  preset,
  range,
  isLive,
  onPresetChange,
  onCustomRangeChange,
}: PeriodSelectorProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const filename = `tapmesa-chamados-${range.from}-${range.to}.csv`;
      await downloadAuthenticated(
        analyticsApi.getExportCsvUrl(range.from, range.to),
        filename,
      );
      toast({
        title: "Exportação concluída",
        description: `Relatório CSV do período ${range.from} a ${range.to} baixado com sucesso.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo CSV.",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Seletor de Presets (Tabs Pílula) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPresetChange("today")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === "today"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => onPresetChange("yesterday")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === "yesterday"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Ontem
          </button>

          <button
            type="button"
            onClick={() => onPresetChange("7d")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === "7d"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            7 dias
          </button>

          <button
            type="button"
            onClick={() => onPresetChange("30d")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === "30d"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            30 dias
          </button>

          <button
            type="button"
            onClick={() => onPresetChange("custom")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              preset === "custom"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            Personalizado
          </button>

          {/* Badge de tempo real */}
          {isLive && (
            <div className="ml-1 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Tempo real (30s)</span>
            </div>
          )}
        </div>

        {/* Ações: Exportar CSV */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            isLoading={isExporting}
            className="gap-2 text-xs font-semibold h-9"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Inputs de Data para modo Personalizado */}
      {preset === "custom" && (
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs animate-in fade-in-0 duration-150">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-zinc-500 font-medium">De:</span>
            <Input
              type="date"
              value={range.from}
              onChange={(e) =>
                onCustomRangeChange({ ...range, from: e.target.value })
              }
              className="h-9 w-full sm:w-44 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-zinc-500 font-medium">Até:</span>
            <Input
              type="date"
              value={range.to}
              onChange={(e) =>
                onCustomRangeChange({ ...range, to: e.target.value })
              }
              className="h-9 w-full sm:w-44 text-xs font-mono"
            />
          </div>

          <div className="text-[11px] text-zinc-400 ml-auto hidden sm:block">
            Datas calculadas no fuso horário do restaurante
          </div>
        </div>
      )}
    </div>
  );
}
