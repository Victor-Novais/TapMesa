"use client";

import * as React from "react";

export interface UseWakeLockResult {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<boolean>;
  release: () => Promise<void>;
}

const emptySubscribe = () => () => {};

export function useWakeLock(autoAcquire = false): UseWakeLockResult {
  const isSupported = React.useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      Boolean(navigator.wakeLock),
    () => false,
  );

  const [isActive, setIsActive] = React.useState(false);
  const sentinelRef = React.useRef<WakeLockSentinel | null>(null);

  const request = React.useCallback(async (): Promise<boolean> => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      if (sentinelRef.current && !sentinelRef.current.released) {
        setIsActive(true);
        return true;
      }

      const sentinel = await navigator.wakeLock.request("screen");
      sentinelRef.current = sentinel;
      setIsActive(true);

      sentinel.addEventListener("release", () => {
        sentinelRef.current = null;
        setIsActive(false);
      });

      return true;
    } catch {
      setIsActive(false);
      return false;
    }
  }, []);

  const release = React.useCallback(async (): Promise<void> => {
    try {
      if (sentinelRef.current) {
        await sentinelRef.current.release();
        sentinelRef.current = null;
      }
    } catch {
      // Ignora erro ao liberar
    } finally {
      setIsActive(false);
    }
  }, []);

  // Readquire o Wake Lock automaticamente ao voltar à aba (RF-D14 / Passo 1)
  React.useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && (autoAcquire || isActive)) {
        await request();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoAcquire, isActive, request]);

  // Limpa wake lock em unmount
  React.useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        void sentinelRef.current.release();
      }
    };
  }, []);

  return {
    isSupported,
    isActive,
    request,
    release,
  };
}
