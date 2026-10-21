"use client";

import { WifiOff } from "lucide-react";
import { useOnline } from "@/shared/lib/use-online";
import { UI_MESSAGES } from "@/shared/messages/ui";

export function OfflineBanner() {
  const isOnline = useOnline();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative z-40 flex items-center justify-center gap-2 bg-zinc-900 px-4 py-2 text-center text-xs font-medium text-white shadow-sm dark:bg-zinc-800"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
      <span>
        {UI_MESSAGES.offline.title}: O TapMesa tentará reconectar
        automaticamente.
      </span>
    </div>
  );
}
