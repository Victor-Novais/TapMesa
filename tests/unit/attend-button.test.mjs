// Botão do card no painel: para conta, "atendido" é pagamento recebido.
import { test } from "node:test";
import assert from "node:assert/strict";
import { getAttendButtonLabels } from "../../src/features/panel/lib/attend-button.ts";

test("panel-call-card: conta mostra 'Pagamento recebido'", () => {
  assert.deepEqual(getAttendButtonLabels("BILL", 7), {
    text: "Pagamento recebido",
    ariaLabel: "Confirmar pagamento da mesa 7",
  });
});

test("panel-call-card: garçom mantém 'Atendido'", () => {
  assert.deepEqual(getAttendButtonLabels("WAITER", 3), {
    text: "Atendido",
    ariaLabel: "Concluir atendimento da mesa 3",
  });
});
