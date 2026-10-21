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
        className="sm:max-w-md p-6 sm:p-8 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
            <Tv className="h-8 w-8" />
          </div>

          <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Iniciar Painel Operacional
          </DialogTitle>

          <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Prepare a estação de {restaurantName} para operar continuamente
            durante todo o expediente.
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400 shrink-0">
              <Volume2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Áudio & Voz Desbloqueados
              </p>
              <p className="text-[11px] text-zinc-500">
                Sons distintos para garçom, conta e anúncio de mesa em
                português.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 shrink-0">
              <Maximize className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Modo Tela Cheia
              </p>
              <p className="text-[11px] text-zinc-500">
                Ocupa toda a tela da TV ou tablet sem distrações de navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 shrink-0">
              <SunMedium className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Tela Sempre Ligada (Wake Lock)
              </p>
              <p className="text-[11px] text-zinc-500">
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
            className="w-full h-14 min-h-[56px] text-base font-extrabold shadow-lg hover:shadow-orange-500/25 gap-2"
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
            className="w-full text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Abrir sem entrar em tela cheia
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
