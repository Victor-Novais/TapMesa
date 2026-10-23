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
import { Button, IconButton } from "@/shared/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import {
  QrCode,
  Pause,
  Play,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { triggerHaptic } from "@/shared/lib/haptics";
import { useToast } from "@/shared/ui/toast";
import type { TableDto } from "@/shared/types/api";

export interface TablesTableProps {
  tables: TableDto[];
  onViewQr: (table: TableDto) => void;
  onTogglePause: (table: TableDto) => void;
  onDelete: (table: TableDto) => void;
  isTogglingId?: string | null;
}

export function TablesTable({
  tables,
  onViewQr,
  onTogglePause,
  onDelete,
  isTogglingId,
}: TablesTableProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyLink = async (table: TableDto, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(table.url);
      triggerHaptic(25);
      setCopiedId(table.id);
      toast({
        title: "Link copiado!",
        description: `Link da Mesa ${table.number} copiado para a área de transferência.`,
        type: "success",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        type: "error",
      });
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
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Mesa</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead>Link do QR Code</TableHead>
            <TableHead className="w-[180px]">Cadastrada em</TableHead>
            <TableHead className="w-[200px] text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.map((table) => {
            const isToggling = isTogglingId === table.id;
            const isCopied = copiedId === table.id;

            return (
              <TableRow key={table.id} className="group">
                {/* Número da mesa */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 font-mono text-sm font-bold text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      {String(table.number).padStart(2, "0")}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Mesa {table.number}
                    </span>
                  </div>
                </TableCell>

                {/* Status de atendimento */}
                <TableCell>
                  {table.paused ? (
                    <Badge variant="alert" size="sm" className="gap-1.5">
                      <PauseCircle className="h-3.5 w-3.5" />
                      Pausada
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm" className="gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Ativa
                    </Badge>
                  )}
                </TableCell>

                {/* Link do autoatendimento com cópia rápida */}
                <TableCell>
                  <div className="flex items-center gap-2 max-w-xs">
                    <span className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {table.url}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(table, e)}
                          className="rounded-lg p-1.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                          aria-label={`Copiar link da Mesa ${table.number}`}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isCopied ? "Copiado!" : "Copiar link"}
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={table.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          aria-label={`Abrir Mesa ${table.number} em nova aba`}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent>Abrir mesa</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>

                {/* Data de criação */}
                <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {formatDate(table.createdAt)}
                </TableCell>

                {/* Ações */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Botão Ver QR */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewQr(table)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <QrCode className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                      Ver QR
                    </Button>

                    {/* Botão Pausar / Retomar */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          aria-label={
                            table.paused
                              ? `Retomar atendimento da Mesa ${table.number}`
                              : `Pausar atendimento da Mesa ${table.number}`
                          }
                          variant="ghost"
                          size="sm"
                          isLoading={isToggling}
                          onClick={() => onTogglePause(table)}
                          className={
                            table.paused
                              ? "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              : "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                          }
                        >
                          {table.paused ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        {table.paused ? "Retomar chamados" : "Pausar chamados"}
                      </TooltipContent>
                    </Tooltip>

                    {/* Botão Excluir */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          aria-label={`Excluir Mesa ${table.number}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(table)}
                          className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>Excluir mesa</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
