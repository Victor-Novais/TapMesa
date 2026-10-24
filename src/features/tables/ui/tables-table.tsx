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
                    <span className="flex h-8 w-8 items-center justify-center rounded-control bg-nav text-sm font-semibold text-ink tabular-nums">
                      {String(table.number).padStart(2, "0")}
                    </span>
                    <span className="font-semibold whitespace-nowrap text-ink">
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
                    <span className="truncate font-mono text-xs text-ink-2">
                      {table.url}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => handleCopyLink(table, e)}
                          className="rounded-control p-1.5 min-h-11 min-w-11 inline-flex items-center justify-center text-ink-2 hover:bg-nav hover:text-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                          aria-label={`Copiar link da Mesa ${table.number}`}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-success" />
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
                          className="rounded-chip p-1 text-ink-2 hover:bg-nav hover:text-ink-2"
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
                <TableCell className="text-xs text-ink-2 tabular-nums">
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
                      className="gap-1.5 whitespace-nowrap"
                    >
                      <QrCode className="h-4 w-4" aria-hidden />
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
                              ? "text-success hover:bg-success-tint"
                              : "text-warning-ink hover:bg-warning-tint"
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
                          className="text-ink-2 hover:bg-danger-tint hover:text-danger-ink"
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
