"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/shared/ui/button";

export interface PwaInstallPromptProps {
  isInstallable: boolean;
  onInstall: () => Promise<boolean>;
  className?: string;
}

export function PwaInstallPrompt({
  isInstallable,
  onInstall,
  className,
}: PwaInstallPromptProps) {
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isInstalling, setIsInstalling] = React.useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await onInstall();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <aside
      role="region"
      aria-label="Convite para instalar o aplicativo TapMesa"
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50/90 px-4 py-2.5 text-orange-950 shadow-sm dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-100 ${
        className || ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shrink-0 shadow-xs">
          <Download className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold leading-tight">
            Instalar TapMesa nesta Estação ou TV
          </p>
          <p className="text-[11px] text-orange-800 dark:text-orange-300">
            Acesse rapidamente em tela cheia direto da tela inicial.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="primary"
          onClick={() => void handleInstall()}
          isLoading={isInstalling}
          className="h-7 text-xs font-bold px-3"
        >
          Instalar App
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsDismissed(true)}
          className="h-7 w-7 p-0 text-orange-700 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-100"
          aria-label="Fechar convite de instalação"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
