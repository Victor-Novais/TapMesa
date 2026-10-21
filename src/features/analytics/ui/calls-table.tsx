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
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import {
  Bell,
  Receipt,
  Star,
  CheckCircle2,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { formatDurationSec } from "../lib/operational-date";
import type { AnalyticsCallItem, CallStatus } from "@/shared/types/api";

export interface CallsTableProps {
  calls: AnalyticsCallItem[];
  hasMore: boolean;
  nextCursor?: string | null;
  onPageChange?: (cursor: string | null) => void;
  isLoading?: boolean;
}

function formatCallTime(dateStr: string | null): string {
  if (!dateStr) return "--:--";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function CallsTable({
  calls,
  hasMore,
  nextCursor,
  onPageChange,
  isLoading,
}: CallsTableProps) {
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [tableSearch, setTableSearch] = React.useState<string>("");
  const [selectedCall, setSelectedCall] =
    React.useState<AnalyticsCallItem | null>(null);

  // Filtragem local dos itens recebidos
  const filteredCalls = React.useMemo(() => {
    return calls.filter((call) => {
      if (typeFilter !== "all" && call.type !== typeFilter) return false;
      if (statusFilter !== "all" && call.status !== statusFilter) return false;
      if (
        tableSearch.trim() &&
        !String(call.tableNumber).includes(tableSearch.trim())
      ) {
        return false;
      }
      return true;
    });
  }, [calls, typeFilter, statusFilter, tableSearch]);

  const renderStatusBadge = (status: CallStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge variant="success" size="sm" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Confirmado
          </Badge>
        );
      case "ATTENDED":
        return (
          <Badge variant="primary" size="sm">
            Atendido
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="alert" size="sm" className="gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pendente
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="neutral" size="sm">
            Cancelado
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="danger" size="sm">
            Expirado
          </Badge>
        );
      case "CLOSED_UNCONFIRMED":
        return (
          <Badge variant="neutral" size="sm">
            Encerrado
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return <span className="text-zinc-400 text-xs">--</span>;
    return (
      <div className="flex items-center gap-1 font-mono text-xs font-semibold">
        <Star
          className={`h-3.5 w-3.5 ${
            rating === 3
              ? "fill-yellow-400 text-yellow-500"
              : rating === 2
                ? "fill-amber-300 text-amber-500"
                : "fill-red-300 text-red-500"
          }`}
        />
        <span>
          {rating === 3 ? "3 (Bom)" : rating === 2 ? "2 (Reg.)" : "1 (Ruim)"}
        </span>
      </div>
    );
  };

  return (
    <div
      className={`space-y-4 ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
    >
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="Filtrar por tipo de chamado"
          >
            <option value="all">Todos os tipos</option>
            <option value="WAITER">Garçom</option>
            <option value="BILL">Conta</option>
          </select>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="ATTENDED">Atendidos</option>
            <option value="PENDING">Pendentes</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="EXPIRED">Expirados</option>
          </select>
        </div>

        {/* Busca por Mesa */}
        <div className="w-full sm:w-48">
          <Input
            placeholder="Filtrar por mesa..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            startAdornment={<Search className="h-3.5 w-3.5" />}
            endAdornment={
              tableSearch ? (
                <button
                  type="button"
                  onClick={() => setTableSearch("")}
                  className="rounded-md p-1 text-zinc-400 hover:text-zinc-700"
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null
            }
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Conteúdo: Tabela Desktop / Cards Mobile */}
      {filteredCalls.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-zinc-200 rounded-2xl dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-500">
            Nenhum chamado encontrado com os filtros aplicados.
          </p>
        </div>
      ) : (
        <>
          {/* 1. Tabela Desktop / Tablet */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Mesa</TableHead>
                  <TableHead className="w-[110px]">Tipo</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead>Linha do Tempo</TableHead>
                  <TableHead className="text-right">
                    Reação / Execução
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    Avaliação
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-zinc-50/75 dark:hover:bg-zinc-800/40"
                    onClick={() => setSelectedCall(call)}
                  >
                    <TableCell className="font-mono font-bold">
                      Mesa {call.tableNumber}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {call.type === "BILL" ? (
                          <>
                            <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Conta</span>
                          </>
                        ) : (
                          <>
                            <Bell className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            <span>Garçom</span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{renderStatusBadge(call.status)}</TableCell>

                    <TableCell className="text-xs text-zinc-500 font-mono">
                      <span>{formatCallTime(call.createdAt)}</span>
                      {call.attendedAt && (
                        <span className="text-zinc-400">
                          {" "}
                          ➔ {formatCallTime(call.attendedAt)}
                        </span>
                      )}
                      {call.confirmedAt && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {" "}
                          ➔ {formatCallTime(call.confirmedAt)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs">
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                        {formatDurationSec(call.reactionTimeSec)}
                      </span>
                      {call.executionTimeSec !== null && (
                        <span className="text-zinc-400 text-[11px] block">
                          total: {formatDurationSec(call.executionTimeSec)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {renderRating(call.rating)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 2. Cards no Mobile */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {filteredCalls.map((call) => (
              <Card
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="p-3.5 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-50">
                      Mesa {call.tableNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-500">
                      {call.type === "BILL" ? (
                        <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Bell className="h-3.5 w-3.5 text-orange-600" />
                      )}
                      {call.type === "BILL" ? "Conta" : "Garçom"}
                    </span>
                  </div>
                  {renderStatusBadge(call.status)}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-500 font-mono">
                  <span>Criado: {formatCallTime(call.createdAt)}</span>
                  <span>Espera: {formatDurationSec(call.reactionTimeSec)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Paginação por Cursor */}
      {(hasMore || nextCursor) && onPageChange && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(null)}
            className="text-xs gap-1"
          >
            Primeira página
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => onPageChange(nextCursor || null)}
            className="text-xs gap-1"
          >
            <span>Próximos chamados</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Drawer de Detalhes do Chamado */}
      <Drawer
        open={Boolean(selectedCall)}
        onOpenChange={(open) => {
          if (!open) setSelectedCall(null);
        }}
      >
        <DrawerContent position="bottom" className="sm:max-w-md sm:mx-auto">
          {selectedCall && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    Mesa {selectedCall.tableNumber} ·{" "}
                    {selectedCall.type === "BILL" ? "Conta" : "Garçom"}
                  </h3>
                  <p className="text-xs text-zinc-400">ID: {selectedCall.id}</p>
                </div>
                {renderStatusBadge(selectedCall.status)}
              </div>

              {/* Linha do Tempo */}
              <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3 text-xs">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Linha do Tempo:
                </p>
                <div className="space-y-2 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Solicitado:</span>
                    <span className="text-zinc-900 dark:text-zinc-200">
                      {formatFullDate(selectedCall.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Atendido:</span>
                    <span className="text-zinc-900 dark:text-zinc-200">
                      {formatFullDate(selectedCall.attendedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Confirmado:</span>
                    <span className="text-zinc-900 dark:text-zinc-200">
                      {formatFullDate(selectedCall.confirmedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas do Chamado */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <span className="text-zinc-500">Tempo de Reação:</span>
                  <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50 mt-1">
                    {formatDurationSec(selectedCall.reactionTimeSec)}
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <span className="text-zinc-500">Avaliação do Cliente:</span>
                  <div className="mt-1">
                    {renderRating(selectedCall.rating)}
                  </div>
                </div>
              </div>

              {selectedCall.reopenCount > 0 && (
                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Chamado contestado pelo cliente e reaberto{" "}
                  <strong>{selectedCall.reopenCount} vez(es)</strong>.
                </div>
              )}
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
