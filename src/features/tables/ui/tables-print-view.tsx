"use client";

import * as React from "react";
import Link from "next/link";
import { useTablesPrintViewQuery } from "../api/use-tables-query";
import { TablePrintCard } from "./table-print-card";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  Printer,
  ArrowLeft,
  QrCode,
  CheckSquare,
  Square,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";

export function TablesPrintView() {
  const { data, isLoading, isError, error, refetch } =
    useTablesPrintViewQuery();

  // Controla exclusões de seleção: por padrão todas as mesas vêm selecionadas (sem useEffect / sem efeito em cascata)
  const [deselectedTableIds, setDeselectedTableIds] = React.useState<
    Set<string>
  >(() => new Set());
  const [layoutSize, setLayoutSize] = React.useState<"standard" | "large">(
    "standard",
  );

  const tables = React.useMemo(() => data?.tables || [], [data?.tables]);

  const allSelected =
    tables.length > 0 &&
    tables.every((table) => !deselectedTableIds.has(table.id));

  const handleToggleSelectAll = () => {
    if (allSelected) {
      // Desmarca todas
      setDeselectedTableIds(new Set(tables.map((t) => t.id)));
    } else {
      // Seleciona todas
      setDeselectedTableIds(new Set());
    }
  };

  const handleToggleTable = (id: string) => {
    setDeselectedTableIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const selectedTables = React.useMemo(() => {
    return tables.filter((t) => !deselectedTableIds.has(t.id));
  }, [tables, deselectedTableIds]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 text-center dark:border-red-950/60 dark:bg-red-950/20">
        <AlertCircle className="mx-auto h-10 w-10 text-red-600 dark:text-red-400" />
        <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Não foi possível carregar os dados de impressão
        </h3>
        <p className="mt-1 text-sm text-zinc-500 max-w-sm mx-auto">
          {error instanceof Error
            ? error.message
            : "Verifique a conexão com o servidor e tente novamente."}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-4 gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Recarregar
        </Button>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <EmptyState
        icon={
          <QrCode className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        }
        title="Nenhuma mesa para imprimir"
        description="Cadastre as mesas do salão na tela de Gestão de Mesas antes de gerar a folha de impressão."
        action={
          <Button variant="primary" asChild className="gap-2">
            <Link href="/dashboard/tables">
              <ArrowLeft className="h-4 w-4" />
              Ir para Gestão de Mesas
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      {/* Barra de Ferramentas da Tela (oculta durante a impressão física via print:hidden) */}
      <div className="print:hidden space-y-4">
        {/* Topo: Navegação e Ação Primária */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/dashboard/tables">
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                Impressão de QR Codes
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {data?.restaurantName} · Folha A4 para recorte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={selectedTables.length === 0}
              className="gap-2 shadow-sm font-semibold"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir ({selectedTables.length})</span>
            </Button>
          </div>
        </div>

        {/* Painel de Controles: Seleção de Mesas e Layout */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Controles de Seleção */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleSelectAll}
                className="gap-1.5 text-xs h-8"
              >
                {allSelected ? (
                  <>
                    <Square className="h-3.5 w-3.5" />
                    <span>Desmarcar todas</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Selecionar todas</span>
                  </>
                )}
              </Button>
              <span className="text-zinc-500 font-medium">
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {selectedTables.length}
                </strong>{" "}
                de {tables.length} mesas selecionadas
              </span>
            </div>

            {/* Alternância de Formato / Densidade */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Tamanho do Cartão:</span>
              <div className="flex items-center rounded-xl border border-zinc-200 p-0.5 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setLayoutSize("standard")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    layoutSize === "standard"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  6 por página (Padrão)
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutSize("large")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    layoutSize === "large"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  }`}
                >
                  4 por página (Grande)
                </button>
              </div>
            </div>
          </div>

          {/* Seletores individuais de mesa */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 max-h-24 overflow-y-auto">
            {tables.map((table) => {
              const isChecked = !deselectedTableIds.has(table.id);
              return (
                <button
                  key={table.id}
                  type="button"
                  onClick={() => handleToggleTable(table.id)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors ${
                    isChecked
                      ? "border-orange-500 bg-orange-50 text-orange-950 font-bold dark:bg-orange-950/40 dark:text-orange-200"
                      : "border-zinc-200 text-zinc-400 hover:border-zinc-300 dark:border-zinc-800"
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggleTable(table.id)}
                    className="h-3 w-3"
                  />
                  <span>Mesa {table.number}</span>
                </button>
              );
            })}
          </div>

          {/* Dica de Impressão */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-xl">
            <Info className="h-4 w-4 text-orange-600 shrink-0" />
            <span>
              <strong>Dica de impressão:</strong> Na caixa de diálogo do
              navegador, certifique-se de escolher o destino como{" "}
              <strong>Salvar como PDF</strong> ou sua impressora física, tamanho{" "}
              <strong>A4</strong> e margens <strong>Padrão</strong> ou{" "}
              <strong>Mínimas</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Área de Impressão / Pré-via em Tela (idêntica ao resultado impresso) */}
      <div className="print:m-0 print:p-0">
        {selectedTables.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-2xl dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500">
              Nenhuma mesa selecionada para impressão. Selecione ao menos uma
              mesa acima.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-4 print:gap-3 ${
              layoutSize === "large"
                ? "grid-cols-1 sm:grid-cols-2 print:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2"
            }`}
          >
            {selectedTables.map((table) => (
              <TablePrintCard
                key={table.id}
                table={table}
                restaurantName={data?.restaurantName || "TapMesa"}
                logoUrl={data?.logoUrl || null}
                primaryColor={data?.primaryColor || "#ea580c"}
                layoutSize={layoutSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
