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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3 rounded-2xl bg-zinc-50 p-4 border border-zinc-200 dark:bg-zinc-800/60 dark:border-zinc-700/60 text-left">
          {username && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Nome de Usuário
              </span>
              <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">
                {username}
              </p>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Senha Temporária
            </span>
            <div className="mt-1 flex items-center justify-between rounded-xl bg-white p-2.5 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
              <span className="font-mono text-lg font-bold tracking-wider text-orange-600 dark:text-orange-400 select-all">
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
                    <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
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

        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
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
