"use client";

import * as React from "react";
import { Volume2, Maximize, SunMedium, Play, Tv } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

export interface PanelStartDialogProps {
  open: boolean;
  onStart: (enableFullscreen: boolean) => Promise<void>;
  restaurantName?: string;
}

export function PanelStartDialog({
  open,
  onStart,
  restaurantName = "Salão",
}: PanelStartDialogProps) {
  const [isStarting, setIsStarting] = React.useState(false);

  const handleStart = async (enableFullscreen: boolean) => {
    setIsStarting(true);
    try {
      await onStart(enableFullscreen);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md p-6 sm:p-8 bg-surface border-border shadow-elevation-3 rounded-sheet"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-sheet bg-brand-tint text-primary-ink">
            <Tv className="h-8 w-8" />
          </div>

          <DialogTitle className="text-2xl font-bold tracking-tight text-ink">
            Iniciar Painel Operacional
          </DialogTitle>

          <DialogDescription className="text-sm text-ink-2 leading-relaxed">
            Prepare a estação de {restaurantName} para operar continuamente
            durante todo o expediente.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-3 rounded-card bg-nav p-4 border border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-2">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Áudio & Voz Desbloqueados
              </p>
              <p className="text-xs text-ink-2">
                Sons distintos para garçom, conta e anúncio de mesa em
                português.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-2">
              <Maximize className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Modo Tela Cheia</p>
              <p className="text-xs text-ink-2">
                Ocupa toda a tela da TV ou tablet sem distrações de navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center text-ink-2">
              <SunMedium className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                Tela Sempre Ligada (Wake Lock)
              </p>
              <p className="text-xs text-ink-2">
                Impede que a TV ou tablet apague ou entre em repouso.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <Button
            type="button"
            size="lg"
            variant="primary"
            onClick={() => void handleStart(true)}
            isLoading={isStarting}
            disabled={isStarting}
            className="h-14 min-h-14 w-full gap-2 text-base"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Iniciar Painel Completo</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void handleStart(false)}
            disabled={isStarting}
            className="w-full text-sm text-ink-2 hover:text-ink"
          >
            Abrir sem entrar em tela cheia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
