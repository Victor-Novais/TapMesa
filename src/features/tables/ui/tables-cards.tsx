"use client";

import * as React from "react";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import {
  QrCode,
  MoreVertical,
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

export interface TablesCardsProps {
  tables: TableDto[];
  onViewQr: (table: TableDto) => void;
  onTogglePause: (table: TableDto) => void;
  onDelete: (table: TableDto) => void;
  isTogglingId?: string | null;
}

export function TablesCards({
  tables,
  onViewQr,
  onTogglePause,
  onDelete,
  isTogglingId,
}: TablesCardsProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const getTableUrl = (token: string) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    return `${origin}/m/${token}`;
  };

  const handleCopyLink = async (table: TableDto) => {
    const url = getTableUrl(table.token);
    try {
      await navigator.clipboard.writeText(url);
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {tables.map((table) => {
        const isToggling = isTogglingId === table.id;
        const isCopied = copiedId === table.id;
        const fullUrl = getTableUrl(table.token);

        return (
          <Card
            key={table.id}
            className="p-4 flex flex-col justify-between transition-shadow hover:shadow-md"
          >
            {/* Topo do Card: Número, Status e Menu de 3 Pontos */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 font-mono text-base font-bold text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  {String(table.number).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">
                    Mesa {table.number}
                  </h3>
                  <div className="mt-0.5">
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
                  </div>
                </div>
              </div>

              {/* Menu de ações secundárias no mobile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label={`Mais opções para a Mesa ${table.number}`}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </IconButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onViewQr(table)}>
                    <QrCode className="mr-2 h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span>Ver QR Code</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopyLink(table)}>
                    {isCopied ? (
                      <Check className="mr-2 h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="mr-2 h-4 w-4" />
                    )}
                    <span>{isCopied ? "Link copiado!" : "Copiar link"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      <span>Abrir autoatendimento</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onTogglePause(table)}>
                    {table.paused ? (
                      <>
                        <Play className="mr-2 h-4 w-4 text-emerald-600" />
                        <span>Retomar chamados</span>
                      </>
                    ) : (
                      <>
                        <Pause className="mr-2 h-4 w-4 text-amber-600" />
                        <span>Pausar chamados</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="danger"
                    onClick={() => onDelete(table)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Excluir mesa</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Informações centrais */}
            <div className="my-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Identificador:</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300 truncate">
                  /m/{table.token}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Criada em:</span>
                <span className="tabular-nums">
                  {formatDate(table.createdAt)}
                </span>
              </div>
            </div>

            {/* Ações principais no rodapé do card */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewQr(table)}
                className="flex-1 gap-1.5 text-xs font-semibold"
              >
                <QrCode className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                Ver QR Code
              </Button>
              <Button
                variant={table.paused ? "success" : "secondary"}
                size="sm"
                isLoading={isToggling}
                onClick={() => onTogglePause(table)}
                className="gap-1.5 text-xs"
                aria-label={
                  table.paused
                    ? `Retomar Mesa ${table.number}`
                    : `Pausar Mesa ${table.number}`
                }
              >
                {table.paused ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    <span>Retomar</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pausar</span>
                  </>
                )}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
