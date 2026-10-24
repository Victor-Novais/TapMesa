import * as React from "react";

let serverOffsetMs = 0;

/**
 * Sincroniza o relógio da aplicação calculando a diferença entre o horário do servidor e o local.
 */
export function syncClock(serverNowIsoString: string): void {
  try {
    const serverTime = new Date(serverNowIsoString).getTime();
    if (!Number.isNaN(serverTime)) {
      const localTime = Date.now();
      serverOffsetMs = serverTime - localTime;
    }
  } catch {
    // Ignore invalid timestamps
  }
}

/**
 * Retorna o timestamp atual em milissegundos referenciado no horário oficial do servidor.
 */
export function getServerNowMs(): number {
  return Date.now() + serverOffsetMs;
}

/**
 * Calcula os segundos decorridos desde a criação de um chamado em relação ao horário do servidor.
 */
export function calculateElapsedSec(createdAtIsoString: string): number {
  try {
    const createdTime = new Date(createdAtIsoString).getTime();
    if (Number.isNaN(createdTime)) return 0;
    const currentServerTime = getServerNowMs();
    return Math.max(0, Math.floor((currentServerTime - createdTime) / 1000));
  } catch {
    return 0;
  }
}

/**
 * Formata quantidade total de segundos em cronômetro mm:ss (com números tabulares).
 * A partir de 60 min passa a h:mm:ss (ex.: 1:02:06), em vez de minutos acumulados.
 */
export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(safeSeconds / 60) - hours * 60;
  const seconds = safeSeconds % 60;
  const mmss = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

// ============================================================================
// SINGLE TICK GLOBAL EMITTER (1s compartilhado para todos os cronômetros)
// ============================================================================

type TickListener = () => void;
const tickListeners = new Set<TickListener>();
let globalInterval: ReturnType<typeof setInterval> | null = null;

function startGlobalTick() {
  if (globalInterval !== null || typeof window === "undefined") return;
  globalInterval = setInterval(() => {
    tickListeners.forEach((listener) => listener());
  }, 1000);
}

function stopGlobalTick() {
  if (globalInterval !== null && tickListeners.size === 0) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
}

/**
 * Hook de relógio compartilhado com um único timer global de 1 segundo.
 * Evita centenas de setInterval simultâneos no painel e na tela da mesa.
 */
export function useNow(): number {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    const listener: TickListener = () => {
      setTick((prev) => prev + 1);
    };

    tickListeners.add(listener);
    startGlobalTick();

    return () => {
      tickListeners.delete(listener);
      stopGlobalTick();
    };
  }, []);

  return getServerNowMs();
}
