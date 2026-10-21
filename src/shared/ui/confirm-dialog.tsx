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
import { AlertTriangle } from "lucide-react";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
  onConfirm: () => void;
  confirmMatchText?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  isLoading = false,
  onConfirm,
  confirmMatchText,
}: ConfirmDialogProps) {
  const [typedMatch, setTypedMatch] = React.useState("");

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setTypedMatch("");
    }
    onOpenChange(isOpen);
  };

  const handleConfirm = () => {
    setTypedMatch("");
    onConfirm();
  };

  const canConfirm = !confirmMatchText || typedMatch === confirmMatchText;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            {variant === "danger" && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {confirmMatchText && (
          <div className="mt-4 space-y-2 text-left">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Para confirmar, digite exatamente{" "}
              <strong className="text-zinc-950 dark:text-zinc-100 font-mono">
                {confirmMatchText}
              </strong>
              :
            </p>
            <input
              type="text"
              value={typedMatch}
              onChange={(e) => setTypedMatch(e.target.value)}
              placeholder={confirmMatchText}
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!canConfirm || isLoading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
