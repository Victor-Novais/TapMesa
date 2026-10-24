"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";
import { KeyRound, Copy, Check, AlertTriangle } from "lucide-react";

export interface OneTimeSecretDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  username?: string;
  secret: string;
}

export function OneTimeSecretDialog({
  open,
  onClose,
  title = "Credenciais de Acesso Temporárias",
  description = "Copie e armazene esta senha temporária agora. Por segurança, ela nunca mais poderá ser visualizada após o fechamento desta janela.",
  username,
  secret,
}: OneTimeSecretDialogProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      const textToCopy = username
        ? `Usuário: ${username}\nSenha temporária: ${secret}`
        : secret;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setCopied(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-tint text-primary-ink">
              <KeyRound className="h-5 w-5" aria-hidden />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 rounded-card bg-nav p-4 text-left">
          {username && (
            <div>
              <span className="text-xs font-medium text-ink-2">
                Nome de Usuário
              </span>
              <p className="font-mono text-base font-bold text-ink">
                {username}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-medium text-ink-2">
              Senha Temporária
            </span>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-control border border-border bg-surface p-2.5">
              <span className="font-mono text-lg font-bold tracking-wider text-primary-ink select-all">
                {secret}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5"
                aria-label="Copiar credenciais"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-success" aria-hidden />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-control bg-warning-tint p-3 text-xs text-warning-ink">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <p>
            Esta senha será solicitada no primeiro acesso. Certifique-se de que
            o destinatário a receba em canal seguro.
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => handleOpenChange(false)}
          >
            Entendi e salvei
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
