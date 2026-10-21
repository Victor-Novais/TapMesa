/**
 * Dispara vibração tátil leve (haptic feedback) em dispositivos compatíveis (RF-C08).
 * Falha silenciosamente em navegadores ou sistemas que não suportam ou bloqueiam a API.
 */
export function triggerHaptic(durationMs: number = 25): void {
  if (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignora restrições de permissão ou suporte
    }
  }
}
