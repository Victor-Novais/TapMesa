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
}

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
    setToasts((prev) => prev.filter((t) => t.id !== id));
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
        className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl transition-[transform,opacity] duration-200 animate-in fade-in-0 slide-in-from-bottom-3 ease-out dark:bg-zinc-900",
              item.type === "success" &&
                "border-emerald-200 dark:border-emerald-800/60",
              item.type === "error" && "border-red-200 dark:border-red-800/60",
              item.type === "info" && "border-zinc-200 dark:border-zinc-800",
            )}
          >
            <div className="shrink-0 pt-0.5">
              {item.type === "success" && (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              )}
              {item.type === "error" && (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
              {item.type === "info" && (
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {item.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="shrink-0 -mr-2 -mt-2 inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:text-zinc-500 dark:hover:text-zinc-300 transition-transform"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
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
