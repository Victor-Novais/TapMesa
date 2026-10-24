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
      dotColor: "bg-success",
      textColor: "text-success",
      bgColor: "bg-success-tint",
      icon: <Wifi className="h-3.5 w-3.5" />,
    },
    reconnecting: {
      label: "Reconectando...",
      dotColor: "bg-warning",
      textColor: "text-warning-ink",
      bgColor: "bg-warning-tint",
      icon: <RefreshCw className="h-3.5 w-3.5" />,
    },
    offline: {
      label: "Sem conexão",
      dotColor: "bg-danger",
      textColor: "text-danger-ink",
      bgColor: "bg-danger-tint",
      icon: <WifiOff className="h-3.5 w-3.5" />,
    },
  };

  const current = configs[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex flex-none items-center gap-2 whitespace-nowrap rounded-full border border-transparent px-2.5 py-1 text-xs font-medium select-none transition-colors duration-150 ease-out-soft",
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
