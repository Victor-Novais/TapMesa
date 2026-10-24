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
  UserCheck,
  Clock,
  XCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { formatDurationSec } from "../lib/operational-date";
import type { AnalyticsCallsFilters } from "@/shared/api/analytics";
import type {
  AnalyticsCallItem,
  CallStatus,
  CallType,
} from "@/shared/types/api";

export type CallsTableFilters = Pick<
  AnalyticsCallsFilters,
  "type" | "status" | "table"
>;

export interface CallsTableProps {
  calls: AnalyticsCallItem[];
  totalCount?: number;
  nextCursor?: string | null;
  isFirstPage?: boolean;
  onPageChange?: (cursor: string | null) => void;
  filters: CallsTableFilters;
  onFiltersChange: (filters: CallsTableFilters) => void;
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
  totalCount,
  nextCursor,
  isFirstPage = true,
  onPageChange,
  filters,
  onFiltersChange,
  isLoading,
}: CallsTableProps) {
  const [tableSearch, setTableSearch] = React.useState<string>(
    filters.table ? String(filters.table) : "",
  );
  const [selectedCall, setSelectedCall] =
    React.useState<AnalyticsCallItem | null>(null);

  // Os filtros são aplicados pela API (type, status, table) para valerem em todas as páginas
  const hasMore = Boolean(nextCursor);

  const handleTableSearchChange = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setTableSearch(digits);
    const table = digits ? Number(digits) : undefined;
    if (table !== filters.table) onFiltersChange({ ...filters, table });
  };

  const renderStatusBadge = (status: CallStatus) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <Badge variant="success" size="sm" className="gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            Confirmado
          </Badge>
        );
      case "ATTENDED":
        return (
          <Badge variant="primary" size="sm" className="gap-1.5">
            <UserCheck className="h-3 w-3" />
            Atendido
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="alert" size="sm" className="gap-1.5">
            <Clock className="h-3 w-3" aria-hidden />
            Pendente
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="neutral" size="sm" className="gap-1.5">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="danger" size="sm" className="gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            Expirado
          </Badge>
        );
      case "CLOSED_UNCONFIRMED":
        return (
          <Badge variant="neutral" size="sm" className="gap-1.5">
            <Check className="h-3 w-3" />
            Encerrado
          </Badge>
        );
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return <span className="text-ink-2 text-xs">--</span>;
    return (
      <div className="flex items-center gap-1 tabular-nums text-xs font-semibold">
        <Star
          className={`h-3.5 w-3.5 ${
            rating === 3
              ? "fill-warning text-warning-ink"
              : rating === 2
                ? "fill-warning text-warning-ink"
                : "fill-danger text-danger-ink"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro de Tipo */}
          <select
            value={filters.type ?? "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                type:
                  e.target.value === "all"
                    ? undefined
                    : (e.target.value as CallType),
              })
            }
            className="h-8 rounded-control border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring"
            aria-label="Filtrar por tipo de chamado"
          >
            <option value="all">Todos os tipos</option>
            <option value="WAITER">Garçom</option>
            <option value="BILL">Conta</option>
          </select>

          {/* Filtro de Status */}
          <select
            value={filters.status ?? "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status:
                  e.target.value === "all"
                    ? undefined
                    : (e.target.value as CallStatus),
              })
            }
            className="h-8 rounded-control border border-border bg-surface px-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="ATTENDED">Atendidos</option>
            <option value="PENDING">Pendentes</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="EXPIRED">Expirados</option>
            <option value="CLOSED_UNCONFIRMED">Encerrados</option>
          </select>
          {totalCount !== undefined && (
            <span className="text-xs text-ink-2">
              {totalCount} {totalCount === 1 ? "chamado" : "chamados"}
            </span>
          )}
        </div>

        {/* Busca por Mesa */}
        <div className="w-full sm:w-48">
          <Input
            placeholder="Filtrar por mesa..."
            inputMode="numeric"
            aria-label="Filtrar por número da mesa"
            value={tableSearch}
            onChange={(e) => handleTableSearchChange(e.target.value)}
            startAdornment={<Search className="h-3.5 w-3.5" />}
            endAdornment={
              tableSearch ? (
                <button
                  type="button"
                  onClick={() => handleTableSearchChange("")}
                  className="rounded-chip p-1 text-ink-2 hover:text-ink"
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
      {calls.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-card">
          <p className="text-sm font-medium text-ink-2">
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
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-nav"
                    onClick={() => setSelectedCall(call)}
                  >
                    <TableCell className="tabular-nums font-bold">
                      Mesa {call.tableNumber}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {call.type === "BILL" ? (
                          <>
                            <Receipt className="h-3.5 w-3.5 text-success" />
                            <span>Conta</span>
                          </>
                        ) : (
                          <>
                            <Bell className="h-3.5 w-3.5 text-primary-ink" />
                            <span>Garçom</span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{renderStatusBadge(call.status)}</TableCell>

                    <TableCell className="text-xs text-ink-2 tabular-nums">
                      <span>{formatCallTime(call.createdAt)}</span>
                      {call.attendedAt && (
                        <span className="text-ink-2">
                          {" "}
                          ➔ {formatCallTime(call.attendedAt)}
                        </span>
                      )}
                      {call.confirmedAt && (
                        <span className="text-success">
                          {" "}
                          ➔ {formatCallTime(call.confirmedAt)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right tabular-nums text-xs">
                      <span className="text-ink font-semibold">
                        {formatDurationSec(call.reactionTimeSec)}
                      </span>
                      {call.executionTimeSec !== null && (
                        <span className="text-ink-2 text-xs block">
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
            {calls.map((call) => (
              <Card
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className="p-3.5 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-bold text-sm text-ink">
                      Mesa {call.tableNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-ink-2">
                      {call.type === "BILL" ? (
                        <Receipt className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Bell className="h-3.5 w-3.5 text-primary-ink" />
                      )}
                      {call.type === "BILL" ? "Conta" : "Garçom"}
                    </span>
                  </div>
                  {renderStatusBadge(call.status)}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-xs text-ink-2 tabular-nums">
                  <span>Criado: {formatCallTime(call.createdAt)}</span>
                  <span>Espera: {formatDurationSec(call.reactionTimeSec)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Paginação por Cursor */}
      {(hasMore || !isFirstPage) && onPageChange && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isFirstPage}
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
                  <h3 className="text-lg font-bold text-ink">
                    Mesa {selectedCall.tableNumber} ·{" "}
                    {selectedCall.type === "BILL" ? "Conta" : "Garçom"}
                  </h3>
                  <p className="text-xs text-ink-2">ID: {selectedCall.id}</p>
                </div>
                {renderStatusBadge(selectedCall.status)}
              </div>

              {/* Linha do Tempo */}
              <div className="rounded-control border border-border-subtle bg-nav p-4 space-y-3 text-xs">
                <p className="font-semibold text-ink">Linha do Tempo:</p>
                <div className="space-y-2 tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Solicitado:</span>
                    <span className="text-ink">
                      {formatFullDate(selectedCall.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Atendido:</span>
                    <span className="text-ink">
                      {formatFullDate(selectedCall.attendedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-2">Confirmado:</span>
                    <span className="text-ink">
                      {formatFullDate(selectedCall.confirmedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Métricas do Chamado */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-control border border-border p-3">
                  <span className="text-ink-2">Tempo de Reação:</span>
                  <p className="tabular-nums text-base font-bold text-ink mt-1">
                    {formatDurationSec(selectedCall.reactionTimeSec)}
                  </p>
                </div>

                <div className="rounded-control border border-border p-3">
                  <span className="text-ink-2">Avaliação do Cliente:</span>
                  <div className="mt-1">
                    {renderRating(selectedCall.rating)}
                  </div>
                </div>
              </div>

              {selectedCall.reopenCount > 0 && (
                <div className="rounded-control bg-warning-tint p-3 text-xs text-warning-ink">
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
