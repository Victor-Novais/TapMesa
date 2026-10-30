// Política de reconexão do stream da mesa. Várias mesas do mesmo restaurante
// caem juntas (mesmo Wi-Fi, mesmo deploy): sem jitter, todas tentam de novo no
// mesmo instante e disputam os limites do back.

export const INITIAL_RETRY_DELAY_MS = 2_000;
export const MAX_RETRY_DELAY_MS = 30_000;
/** Falhas seguidas antes de mostrar "Sem conexão" com a rede do aparelho ativa. */
export const FAILURES_BEFORE_OFFLINE = 3;
/** Janela em que visibilitychange/online não antecipam uma reconexão já agendada. */
export const RETRY_DEBOUNCE_MS = 2_000;

/** Próximo atraso base: dobra até o teto. */
export function nextRetryDelay(current: number): number {
  return Math.min(current * 2, MAX_RETRY_DELAY_MS);
}

/** Aplica jitter de ±30% ao atraso. `random` em [0, 1). */
export function withJitter(
  delay: number,
  random: number = Math.random(),
): number {
  return Math.round(delay * (0.7 + random * 0.6));
}

/**
 * Status após uma falha do EventSource. Um 429 ou uma queda breve do servidor
 * não são "sem conexão" do ponto de vista do cliente.
 */
export function statusAfterFailure(
  consecutiveFailures: number,
  online: boolean,
): "reconnecting" | "offline" {
  return !online || consecutiveFailures >= FAILURES_BEFORE_OFFLINE
    ? "offline"
    : "reconnecting";
}
