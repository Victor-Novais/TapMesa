// Regras de estado dos chamados na tela da mesa, sem React (testáveis com node:test).
import type { PublicCallDto } from "@/shared/types/api";

export type ConfirmedCardVariant = "waiter" | "bill";

export const CONFIRMED_AUTO_DISMISS_MS = 3500;

/**
 * Conta paga com link de avaliação fica na tela até o cliente fechar, para dar
 * tempo de tocar em "Avaliar no Google". Nos demais casos o agradecimento some.
 */
export function shouldAutoDismissConfirmed(
  variant: ConfirmedCardVariant,
  googleReviewUrl?: string | null,
): boolean {
  return !(variant === "bill" && googleReviewUrl);
}

/**
 * `call.attended` não traz o tipo do chamado. Para conta, "atendido" é o pagamento
 * e o `call.confirmed` chega em seguida, então o evento é ignorado.
 */
export function shouldApplyAttendedEvent(
  calls: PublicCallDto[] | undefined,
  callId: string,
): boolean {
  return calls?.find((c) => c.id === callId)?.type !== "BILL";
}

export function dismissedStorageKey(token: string): string {
  return `tapmesa:dismissed:${token}`;
}

// sessionStorage pode lançar exceção (navegação privada, site data bloqueado)
export function readDismissedIds(
  storage: Pick<Storage, "getItem"> | undefined,
  token: string,
): Set<string> {
  try {
    const raw = storage?.getItem(dismissedStorageKey(token));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function writeDismissedIds(
  storage: Pick<Storage, "setItem"> | undefined,
  token: string,
  ids: Set<string>,
): void {
  try {
    storage?.setItem(dismissedStorageKey(token), JSON.stringify([...ids]));
  } catch {
    // Sem persistência: o card reaparece ao recarregar, o que é aceitável
  }
}
