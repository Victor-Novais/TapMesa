"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
  leaving?: boolean;
}

// Duração da animação de saída (DESIGN_PLAN §2.10: saída em 150ms)
const TOAST_EXIT_MS = 150;

interface ToastContextType {
  toasts: ToastItem[];
  toast: (options: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined,
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    // Marca como saindo para a animação de saída e remove em seguida
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_EXIT_MS);
  }, []);

  const toast = React.useCallback(
    ({
      title,
      description,
      type = "info",
      duration = 4000,
    }: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, type, duration };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 pointer-events-none sm:inset-x-auto sm:right-4 sm:items-end"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              // Superfície escura nos dois temas: o escopo .dark aplica os tokens escuros
              "dark pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-border bg-raised p-4 text-ink shadow-elevation-2",
              "animate-in fade-in-0 slide-in-from-bottom-3 duration-200 ease-out-soft",
              item.leaving &&
                "animate-out fade-out-0 slide-out-to-bottom-2 duration-150 ease-in-soft fill-mode-forwards",
              item.type === "error" && "border-l-4 border-l-danger",
            )}
          >
            <div className="shrink-0 pt-0.5" aria-hidden>
              {item.type === "success" && (
                <CheckCircle2 className="h-5 w-5 text-success" />
              )}
              {item.type === "error" && (
                <AlertCircle className="h-5 w-5 text-danger" />
              )}
              {item.type === "info" && <Info className="h-5 w-5 text-ink-2" />}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-ink-2">{item.description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="shrink-0 -mr-2 -mt-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-2 transition-[color,background-color,transform] duration-150 ease-out-soft hover:bg-nav hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
