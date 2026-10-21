"use client";

import * as React from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface UsePwaResult {
  isSupported: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<boolean>;
}

const emptySubscribe = () => () => {};

export function usePwa(): UsePwaResult {
  const isSupported = React.useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && "serviceWorker" in navigator,
    () => false,
  );

  const [isInstallable, setIsInstallable] = React.useState(false);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const deferredPromptRef = React.useRef<BeforeInstallPromptEvent | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Registra o Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registro falhou silenciosamente (ex: em dev ou sem https)
      });
    }

    // Verifica se já está rodando standalone (PWA instalado)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) {
      const timer = setTimeout(() => setIsInstalled(true), 0);
      return () => clearTimeout(timer);
    }

    // Captura evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = React.useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) return false;

    try {
      await deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
        deferredPromptRef.current = null;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return {
    isSupported,
    isInstallable,
    isInstalled,
    installApp,
  };
}
