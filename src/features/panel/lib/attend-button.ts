import type { CallType } from "@/shared/types/api";

// Para conta, "atendido" significa pagamento recebido
export function getAttendButtonLabels(type: CallType, tableNumber: number) {
  return type === "BILL"
    ? {
        text: "Pagamento recebido",
        ariaLabel: `Confirmar pagamento da mesa ${tableNumber}`,
      }
    : {
        text: "Atendido",
        ariaLabel: `Concluir atendimento da mesa ${tableNumber}`,
      };
}
