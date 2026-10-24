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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-danger-tint text-danger-ink">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </div>
            )}
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {confirmMatchText && (
          <div className="mt-4 space-y-2 text-left">
            <p className="text-xs text-ink-2">
              Para confirmar, digite exatamente{" "}
              <strong className="text-ink font-mono">{confirmMatchText}</strong>
              :
            </p>
            <input
              id="confirm-match-input"
              type="text"
              value={typedMatch}
              onChange={(e) => setTypedMatch(e.target.value)}
              placeholder={confirmMatchText}
              aria-label={`Digite ${confirmMatchText} para confirmar`}
              className="flex h-11 w-full rounded-control border border-border-control bg-surface px-3.5 py-2 text-base sm:text-sm text-ink placeholder:text-ink-placeholder hover:border-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-raised"
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
