"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { tablesApi, downloadAuthenticated } from "@/shared/api";
import { triggerHaptic } from "@/shared/lib/haptics";
import { useToast } from "@/shared/ui/toast";
import type { TableDto } from "@/shared/types/api";

export interface TableQrDialogProps {
  table: TableDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TableQrDialog({
  table,
  open,
  onOpenChange,
}: TableQrDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Consulta do SVG autenticado via React Query (com cache e sem efeito colateral direto em render)
  const {
    data: svgData,
    isLoading: isLoadingSvg,
    isError: hasError,
    refetch,
  } = useQuery({
    queryKey: ["tables", "qr-svg", table?.id],
    queryFn: async () => {
      if (!table) return null;
      return tablesApi.getTableQrSvg(table.id);
    },
    enabled: open && Boolean(table?.id),
    staleTime: 60_000,
  });

  // URL canônica do QR, enviada pela API (idêntica ao conteúdo do QR Code)
  const tableUrl = table?.url ?? "";

  const handleCopyLink = async () => {
    if (!tableUrl) return;
    try {
      await navigator.clipboard.writeText(tableUrl);
      triggerHaptic(25);
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: `Link da Mesa ${table?.number} copiado para a área de transferência.`,
        type: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link automaticamente.",
        type: "error",
      });
    }
  };

  const handleDownloadSvg = async () => {
    if (!table) return;
    try {
      setIsDownloading(true);
      await downloadAuthenticated(
        tablesApi.getTableQrSvgUrl(table.id),
        `mesa-${table.number}-qrcode.svg`,
      );
      toast({
        title: "Download concluído",
        description: `QR Code da Mesa ${table.number} baixado com sucesso em formato SVG.`,
        type: "success",
      });
    } catch {
      toast({
        title: "Falha no download",
        description: "Ocorreu um erro ao baixar o arquivo SVG.",
        type: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!table) return null;

  // Converte a string SVG limpa em Data URI seguro (regra D8: sem dangerouslySetInnerHTML)
  const svgDataUri = svgData
    ? `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6 text-center">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-card bg-brand-tint text-primary-ink">
            <QrCode className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-ink">
            QR Code da Mesa {table.number}
          </DialogTitle>
          <DialogDescription className="text-sm text-ink-2">
            Aponte a câmera do celular para abrir o autoatendimento da mesa.
          </DialogDescription>
        </DialogHeader>

        {/* Área do QR Code com proteção contra XSS (SVG via Data URI) */}
        <div className="my-5 flex flex-col items-center justify-center rounded-card border border-border bg-surface p-6">
          {isLoadingSvg ? (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-56 w-56 rounded-control" />
              <p className="text-xs text-ink-2 motion-safe:animate-pulse">
                Carregando QR Code...
              </p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertCircle className="h-10 w-10 text-danger-ink" />
              <p className="text-sm font-medium text-ink">
                Não foi possível carregar o QR Code
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : svgDataUri ? (
            <div className="relative flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={svgDataUri}
                alt={`QR Code para autoatendimento da Mesa ${table.number}`}
                className="h-56 w-56 rounded-control bg-white object-contain p-3"
              />
              <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-ink-2">
                Mesa {table.number}
              </span>
            </div>
          ) : null}
        </div>

        {/* Caixa com o link direto */}
        <div className="mb-4 flex items-center justify-between gap-2 rounded-control border border-border bg-nav p-2.5 text-left">
          <div className="min-w-0 flex-1 px-1">
            <p className="text-xs font-medium text-ink-2 uppercase tracking-wider">
              Link de autoatendimento
            </p>
            <p className="truncate font-mono text-xs text-ink-2">{tableUrl}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="shrink-0"
            aria-label="Copiar link da mesa"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                <span className="text-success">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-ink-2" />
                <span>Copiar</span>
              </>
            )}
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadSvg}
            isLoading={isDownloading}
            disabled={isLoadingSvg || hasError}
            className="w-full sm:w-auto flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar SVG
          </Button>
          <Button
            type="button"
            variant="primary"
            asChild
            className="w-full sm:w-auto flex-1 gap-2"
          >
            <a
              href={tableUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Testar abertura da Mesa ${table.number} em nova aba`}
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Mesa
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
