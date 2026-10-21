import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export type ConnectionStatus = "connected" | "reconnecting" | "offline";

export interface ConnectionIndicatorProps {
  status: ConnectionStatus;
  className?: string;
  showText?: boolean;
}

export function ConnectionIndicator({
  status,
  className,
  showText = true,
}: ConnectionIndicatorProps) {
  const configs = {
    connected: {
      label: "Conectado",
      dotColor: "bg-emerald-500",
      textColor: "text-emerald-700 dark:text-emerald-400",
      bgColor:
        "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
      icon: (
        <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
      ),
    },
    reconnecting: {
      label: "Reconectando...",
      dotColor: "bg-amber-500 animate-pulse",
      textColor: "text-amber-700 dark:text-amber-400",
      bgColor:
        "bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
      icon: (
        <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
      ),
    },
    offline: {
      label: "Sem conexão",
      dotColor: "bg-red-500",
      textColor: "text-red-700 dark:text-red-400",
      bgColor:
        "bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/60",
      icon: <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />,
    },
  };

  const current = configs[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium select-none transition-all",
        current.bgColor,
        current.textColor,
        className,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", current.dotColor)} />
      {showText && <span className="font-medium">{current.label}</span>}
      <span className="sr-only">{`Status da conexão: ${current.label}`}</span>
    </div>
  );
}
