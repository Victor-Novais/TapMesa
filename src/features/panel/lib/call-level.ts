// Nível de espera de um chamado no painel (normal → alerta → urgente).

export type CallLevel = "normal" | "alert" | "urgent";

export interface CallLevelThresholds {
  alertSec: number;
  urgentSec: number;
}

export function getCallLevel(
  elapsedSec: number,
  thresholds: CallLevelThresholds,
): CallLevel {
  if (elapsedSec >= thresholds.urgentSec) return "urgent";
  if (elapsedSec >= thresholds.alertSec) return "alert";
  return "normal";
}

/**
 * Milissegundos até o chamado mudar de nível, ou null se já é urgente.
 * Permite re-renderizar o card só na troca de nível, e não a cada segundo.
 */
export function msUntilNextLevel(
  elapsedSec: number,
  thresholds: CallLevelThresholds,
): number | null {
  const next =
    elapsedSec < thresholds.alertSec
      ? thresholds.alertSec
      : elapsedSec < thresholds.urgentSec
        ? thresholds.urgentSec
        : null;
  return next === null ? null : (next - elapsedSec) * 1000;
}

/** Quantos novos chamados de uma vez passam a ser anunciados em uma frase só. */
export const SPEECH_SUMMARY_THRESHOLD = 3;

/**
 * Frases de voz para os chamados que acabaram de chegar. Numa rajada, um
 * resumo evita que a fala fique minutos atrasada em relação à tela.
 */
export function buildCallSpeech(
  newCalls: { type: string; tableNumber: number; note: string | null }[],
): string[] {
  if (newCalls.length > SPEECH_SUMMARY_THRESHOLD) {
    return [`${newCalls.length} novos chamados.`];
  }
  return newCalls.map((call) => {
    const typeSpeech = call.type === "BILL" ? "pede a conta" : "chama o garçom";
    const noteSpeech = call.note ? " com observação" : "";
    return `Mesa ${call.tableNumber} ${typeSpeech}${noteSpeech}.`;
  });
}
