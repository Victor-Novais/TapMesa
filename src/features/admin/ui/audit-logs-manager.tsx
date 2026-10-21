"use client";

import * as React from "react";
import { useAdminAuditLogsQuery } from "../api/use-admin-queries";
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
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { Drawer, DrawerContent } from "@/shared/ui/drawer";
import {
  ScrollText,
  Search,
  Filter,
  ShieldAlert,
  Code2,
  Eye,
  RefreshCw,
} from "lucide-react";
import type { AdminAuditLogItem } from "@/shared/types/api";

export function AuditLogsManager() {
  const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([
    null,
  ]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const currentCursor = cursorHistory[pageIndex] ?? null;

  // Filter inputs
  const [restaurantIdFilter, setRestaurantIdFilter] = React.useState("");
  const [actorUserIdFilter, setActorUserIdFilter] = React.useState("");
  const [actionSearch, setActionSearch] = React.useState("");

  // Applied filters for query
  const [appliedFilters, setAppliedFilters] = React.useState<{
    restaurantId?: string;
    actorUserId?: string;
  }>({});

  const { data, isLoading, isRefetching, refetch } = useAdminAuditLogsQuery(
    currentCursor,
    50,
    appliedFilters,
  );

  const [selectedLog, setSelectedLog] =
    React.useState<AdminAuditLogItem | null>(null);

  const logs = React.useMemo(() => data?.items ?? [], [data?.items]);

  // Local filter for action search
  const filteredLogs = React.useMemo(() => {
    const q = actionSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.actorRole.toLowerCase().includes(q) ||
        (l.restaurantId && l.restaurantId.toLowerCase().includes(q)),
    );
  }, [logs, actionSearch]);

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCursorHistory([null]);
    setPageIndex(0);
    setAppliedFilters({
      restaurantId: restaurantIdFilter.trim() || undefined,
      actorUserId: actorUserIdFilter.trim() || undefined,
    });
  };

  const handleClearFilters = () => {
    setRestaurantIdFilter("");
    setActorUserIdFilter("");
    setActionSearch("");
    setCursorHistory([null]);
    setPageIndex(0);
    setAppliedFilters({});
  };

  const handleNextPage = () => {
    if (data?.nextCursor && data.hasMore) {
      setCursorHistory((prev) => [
        ...prev.slice(0, pageIndex + 1),
        data.nextCursor,
      ]);
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const isImpersonated = (log: AdminAuditLogItem) => {
    return (
      log.action.toUpperCase().includes("IMPERSONAT") ||
      (log.meta &&
        typeof log.meta === "object" &&
        ("impersonatedBy" in log.meta || "imp" in log.meta))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Trilha de Auditoria
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Registro imutável de eventos administrativos, alterações em
            restaurantes e sessões de suporte.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          <span>Atualizar</span>
        </Button>
      </div>

      {/* Formulário de Filtros */}
      <Card className="p-4 space-y-3">
        <form
          onSubmit={handleApplyFilters}
          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
        >
          <div className="sm:col-span-4">
            <Input
              id="actionSearch"
              label="Buscar por Ação"
              placeholder="ex: RESTAURANT_SUSPENDED..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              startAdornment={<Search className="h-4 w-4 text-zinc-400" />}
              className="h-10 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              id="restaurantFilter"
              label="ID do Restaurante (UUID)"
              placeholder="Filtrar por restaurante..."
              value={restaurantIdFilter}
              onChange={(e) => setRestaurantIdFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <Input
              id="actorFilter"
              label="ID do Usuário / Ator (UUID)"
              placeholder="Filtrar por usuário..."
              value={actorUserIdFilter}
              onChange={(e) => setActorUserIdFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="w-full h-10 gap-1.5 text-xs"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filtrar</span>
            </Button>
            {(appliedFilters.restaurantId ||
              appliedFilters.actorUserId ||
              actionSearch) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="h-10 text-xs shrink-0"
              >
                Limpar
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Listagem */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="h-7 w-7 text-zinc-500" />}
          title="Nenhum log de auditoria encontrado"
          description="Nenhum evento registrado corresponde aos filtros informados."
        />
      ) : (
        <div className="space-y-4">
          {/* 1. Tabela Desktop / Tablet */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Data & Hora</TableHead>
                  <TableHead className="w-[160px]">Ator / Papel</TableHead>
                  <TableHead>Ação Realizada</TableHead>
                  <TableHead className="w-[180px]">Restaurante</TableHead>
                  <TableHead className="w-[110px] text-right">
                    Detalhes
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const impersonated = isImpersonated(log);

                  return (
                    <TableRow key={log.id} className="group">
                      {/* Data / Hora */}
                      <TableCell className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDate(log.timestamp)}
                      </TableCell>

                      {/* Ator */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[140px]">
                            {log.actorUserId}
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            Papel: {log.actorRole}
                          </span>
                        </div>
                      </TableCell>

                      {/* Ação */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {log.action}
                          </span>
                          {impersonated && (
                            <Badge
                              variant="danger"
                              size="sm"
                              className="gap-1 bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300"
                            >
                              <ShieldAlert className="h-3 w-3" />
                              <span>Modo Suporte</span>
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Restaurante */}
                      <TableCell>
                        {log.restaurantId ? (
                          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate block max-w-[160px]">
                            {log.restaurantId}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">
                            Global da Plataforma
                          </span>
                        )}
                      </TableCell>

                      {/* Botão Ver Detalhes */}
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-500" />
                          <span>Ver</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 2. Cards no Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredLogs.map((log) => {
              const impersonated = isImpersonated(log);

              return (
                <Card
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 space-y-2 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {log.action}
                    </span>
                    {impersonated && (
                      <Badge
                        variant="danger"
                        size="sm"
                        className="bg-amber-500/10 text-amber-700 border-amber-500/30"
                      >
                        Suporte
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-500 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <span className="block font-semibold text-zinc-700 dark:text-zinc-300">
                        Ator ({log.actorRole})
                      </span>
                      <span className="font-mono truncate block">
                        {log.actorUserId}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block font-semibold text-zinc-700 dark:text-zinc-300">
                        Data
                      </span>
                      <span className="font-mono">
                        {formatDate(log.timestamp)}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {(pageIndex > 0 || Boolean(data?.hasMore)) && (
            <Pagination
              page={pageIndex + 1}
              hasPreviousPage={pageIndex > 0}
              hasNextPage={Boolean(data?.hasMore)}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          )}
        </div>
      )}

      {/* Drawer de Detalhes do Log */}
      <Drawer
        open={Boolean(selectedLog)}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DrawerContent position="right" className="max-w-md w-full">
          {selectedLog && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  Detalhes do Evento
                </h3>
                <p className="text-xs text-zinc-500">
                  Informações completas e metadados capturados na trilha de
                  auditoria.
                </p>
              </div>

              {/* Informações Primárias */}
              <div className="space-y-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700/60 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                    ID do Evento
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 font-semibold select-all">
                    {selectedLog.id}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/40">
                  <div>
                    <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      Ação
                    </span>
                    <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedLog.action}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                      Papel do Ator
                    </span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {selectedLog.actorRole}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/40">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                    ID do Ator
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all">
                    {selectedLog.actorUserId}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/40">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                    Restaurante Alvo
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100 select-all">
                    {selectedLog.restaurantId ||
                      "Global (Sem restaurante específico)"}
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/40">
                  <span className="font-bold uppercase tracking-wider text-zinc-400 text-[10px]">
                    Timestamp
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-zinc-100">
                    {formatDate(selectedLog.timestamp)}
                  </p>
                </div>
              </div>

              {/* Metadados (Meta JSON escapado) */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <Code2 className="h-4 w-4 text-orange-500" />
                  <span>Metadados da Ação (Payload JSON)</span>
                </div>

                {selectedLog.meta &&
                Object.keys(selectedLog.meta).length > 0 ? (
                  <pre className="max-h-64 overflow-auto rounded-xl bg-zinc-950 p-4 font-mono text-xs text-zinc-100 dark:bg-black border border-zinc-800 select-all leading-relaxed">
                    {JSON.stringify(selectedLog.meta, null, 2)}
                  </pre>
                ) : (
                  <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-xs text-zinc-500 dark:border-zinc-800 text-center">
                    Nenhum metadado adicional registrado para este evento.
                  </p>
                )}
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
