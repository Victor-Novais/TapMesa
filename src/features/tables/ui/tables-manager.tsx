"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import { useTablesQuery } from "../api/use-tables-query";
import {
  usePauseTableMutation,
  useResumeTableMutation,
  useDeleteTableMutation,
} from "../api/use-table-mutations";
import { TablesTable } from "./tables-table";
import { TablesCards } from "./tables-cards";
import { TableQrDialog } from "./table-qr-dialog";
import { BatchCreateTablesDialog } from "./batch-create-tables-dialog";
import {
  QrCode,
  PlusCircle,
  Printer,
  Search,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { TableDto } from "@/shared/types/api";

type StatusFilter = "all" | "active" | "paused";

export function TablesManager() {
  const { toast } = useToast();
  const {
    data: tables = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTablesQuery();

  const pauseMutation = usePauseTableMutation();
  const resumeMutation = useResumeTableMutation();
  const deleteMutation = useDeleteTableMutation();

  // Estados locais
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all");
  const [isBatchOpen, setIsBatchOpen] = React.useState(false);
  const [selectedQrTable, setSelectedQrTable] = React.useState<TableDto | null>(
    null,
  );
  const [tableToDelete, setTableToDelete] = React.useState<TableDto | null>(
    null,
  );
  const [togglingTableId, setTogglingTableId] = React.useState<string | null>(
    null,
  );

  // Contadores
  const totalCount = tables.length;
  const activeCount = React.useMemo(
    () => tables.filter((t) => !t.paused).length,
    [tables],
  );
  const pausedCount = React.useMemo(
    () => tables.filter((t) => t.paused).length,
    [tables],
  );

  // Filtragem
  const filteredTables = React.useMemo(() => {
    return tables.filter((table) => {
      // Filtro por status
      if (statusFilter === "active" && table.paused) return false;
      if (statusFilter === "paused" && !table.paused) return false;

      // Filtro por busca de número
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const numberMatch = String(table.number).includes(query);
        const nameMatch = `mesa ${table.number}`.includes(query);
        if (!numberMatch && !nameMatch) return false;
      }

      return true;
    });
  }, [tables, statusFilter, search]);

  // Ação de alternar pausa/retomada com atualização otimista
  const handleTogglePause = async (table: TableDto) => {
    try {
      setTogglingTableId(table.id);
      if (table.paused) {
        await resumeMutation.mutateAsync(table.id);
        toast({
          title: "Mesa retomada",
          description: `Mesa ${table.number} agora está ativa para receber chamados.`,
          type: "success",
        });
      } else {
        await pauseMutation.mutateAsync(table.id);
        toast({
          title: "Mesa pausada",
          description: `Mesa ${table.number} foi pausada temporariamente.`,
          type: "info",
        });
      }
    } catch (err) {
      const parsed = parseApiError(err);
      toast({
        title: "Erro na operação",
        description:
          parsed.detail || "Não foi possível atualizar o status da mesa.",
        type: "error",
      });
    } finally {
      setTogglingTableId(null);
    }
  };

  // Ação de exclusão
  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;
    try {
      await deleteMutation.mutateAsync(tableToDelete.id);
      toast({
        title: "Mesa excluída",
        description: `Mesa ${tableToDelete.number} e seu QR Code foram removidos.`,
        type: "success",
      });
      setTableToDelete(null);
    } catch (err) {
      const parsed = parseApiError(err);
      toast({
        title: "Erro ao excluir mesa",
        description: parsed.detail || "Não foi possível remover a mesa.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Gestão de Mesas
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Cadastre novas mesas, visualize QR Codes e pause atendimentos
            temporariamente.
          </p>
        </div>

        {/* Botões de Ação Principais */}
        <div className="flex items-center gap-2.5">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/dashboard/tables/print">
              <Printer className="h-4 w-4" />
              <span>Imprimir QR Codes</span>
            </Link>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsBatchOpen(true)}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Criar em lote</span>
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-card border border-border bg-surface p-3">
          {/* Seletor de Status (Tabs Pílula) */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-0.5">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === "all"
                  ? "bg-ink text-canvas"
                  : "text-ink-2 hover:bg-nav"
              }`}
            >
              <span>Todas</span>
              <span className="rounded-full bg-current/15 px-1.5 py-0.5 text-xs tabular-nums">
                {totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === "active"
                  ? "bg-success text-white"
                  : "text-ink-2 hover:bg-nav"
              }`}
            >
              <span>Ativas</span>
              <span className="rounded-full bg-success-tint px-1.5 py-0.5 tabular-nums text-xs">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("paused")}
              className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === "paused"
                  ? "bg-warning text-white"
                  : "text-ink-2 hover:bg-nav"
              }`}
            >
              <span>Pausadas</span>
              <span className="rounded-full bg-warning-tint px-1.5 py-0.5 tabular-nums text-xs">
                {pausedCount}
              </span>
            </button>
          </div>

          {/* Campo de Busca por Número */}
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar mesa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={<Search className="h-4 w-4" />}
              endAdornment={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-chip p-1 text-ink-2 hover:text-ink"
                    aria-label="Limpar busca"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null
              }
              className="h-9 sm:h-9 text-xs"
            />
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      {isLoading ? (
        <div className="space-y-3">
          <div className="rounded-card border border-border bg-surface p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48 rounded-control" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-control" />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : isError ? (
        <div className="rounded-card border border-danger/40 bg-danger-tint p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-danger-ink" />
          <h3 className="mt-3 text-base font-semibold text-ink">
            Não foi possível carregar as mesas
          </h3>
          <p className="mt-1 text-sm text-ink-2 max-w-sm mx-auto">
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
            Recarregar mesas
          </Button>
        </div>
      ) : totalCount === 0 ? (
        /* Estado Vazio: Nenhuma mesa cadastrada ainda */
        <EmptyState
          icon={<QrCode className="h-8 w-8 text-primary-ink" />}
          title="Nenhuma mesa cadastrada"
          description="Cadastre suas mesas para gerar QR Codes individuais e começar a receber chamados de clientes em tempo real."
          action={
            <Button
              variant="primary"
              onClick={() => setIsBatchOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Criar as primeiras mesas
            </Button>
          }
        />
      ) : filteredTables.length === 0 ? (
        /* Estado Vazio de Busca: Filtro não retornou nada */
        <EmptyState
          icon={<Search className="h-7 w-7 text-ink-2" />}
          title="Nenhuma mesa encontrada"
          description={`Nenhum resultado corresponde à busca "${search}".`}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
      ) : (
        /* Listagem de Mesas: Tabela no Desktop/Tablet e Cards no Mobile */
        <div>
          <div className="hidden md:block">
            <TablesTable
              tables={filteredTables}
              onViewQr={(table) => setSelectedQrTable(table)}
              onTogglePause={handleTogglePause}
              onDelete={(table) => setTableToDelete(table)}
              isTogglingId={togglingTableId}
            />
          </div>

          <div className="block md:hidden">
            <TablesCards
              tables={filteredTables}
              onViewQr={(table) => setSelectedQrTable(table)}
              onTogglePause={handleTogglePause}
              onDelete={(table) => setTableToDelete(table)}
              isTogglingId={togglingTableId}
            />
          </div>
        </div>
      )}

      {/* Diálogo de Criação em Lote */}
      <BatchCreateTablesDialog
        open={isBatchOpen}
        onOpenChange={setIsBatchOpen}
      />

      {/* Diálogo de Exibição de QR Code */}
      <TableQrDialog
        table={selectedQrTable}
        open={Boolean(selectedQrTable)}
        onOpenChange={(open) => {
          if (!open) setSelectedQrTable(null);
        }}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        open={Boolean(tableToDelete)}
        onOpenChange={(open) => {
          if (!open) setTableToDelete(null);
        }}
        title={`Excluir Mesa ${tableToDelete?.number}?`}
        description="O QR Code deixará de funcionar imediatamente para os clientes e os chamados pendentes associados serão cancelados. Esta ação é irreversível."
        confirmLabel="Sim, excluir mesa"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
