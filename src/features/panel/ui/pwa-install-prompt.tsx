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
      className={`flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-2.5 text-ink ${
        className || ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center text-primary-ink">
          <Download className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">
            Instalar TapMesa nesta Estação ou TV
          </p>
          <p className="text-xs text-ink-2">
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
          className="px-4"
        >
          Instalar App
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setIsDismissed(true)}
          className="h-11 w-11 min-h-11 p-0 text-ink-2 hover:text-ink"
          aria-label="Fechar convite de instalação"
        >
          <X className="h-5 w-5" aria-hidden />
        </Button>
      </div>
    </aside>
  );
}
