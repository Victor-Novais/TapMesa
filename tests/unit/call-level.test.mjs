// Nível de espera e voz do painel (DIAGNOSTICO_E_PLANO_DE_ACAO.md, Fase 3).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCallSpeech,
  getCallLevel,
  msUntilNextLevel,
} from "../../src/features/panel/lib/call-level.ts";

const thresholds = { alertSec: 180, urgentSec: 300 };

test("nível: normal, alerta e urgente pelos limites do restaurante", () => {
  assert.equal(getCallLevel(0, thresholds), "normal");
  assert.equal(getCallLevel(179, thresholds), "normal");
  assert.equal(getCallLevel(180, thresholds), "alert");
  assert.equal(getCallLevel(299, thresholds), "alert");
  assert.equal(getCallLevel(300, thresholds), "urgent");
});

test("nível: próxima troca agendada só quando muda o nível", () => {
  assert.equal(msUntilNextLevel(0, thresholds), 180_000);
  assert.equal(msUntilNextLevel(170, thresholds), 10_000);
  assert.equal(msUntilNextLevel(200, thresholds), 100_000);
  assert.equal(msUntilNextLevel(300, thresholds), null);
});

test("voz: até 3 chamados novos, uma frase por chamado", () => {
  assert.deepEqual(
    buildCallSpeech([
      { type: "WAITER", tableNumber: 4, note: null },
      { type: "BILL", tableNumber: 9, note: "dividir" },
    ]),
    ["Mesa 4 chama o garçom.", "Mesa 9 pede a conta com observação."],
  );
});

test("voz: numa rajada (mais de 3), um resumo só", () => {
  const burst = Array.from({ length: 5 }, (_, i) => ({
    type: "WAITER",
    tableNumber: i + 1,
    note: null,
  }));
  assert.deepEqual(buildCallSpeech(burst), ["5 novos chamados."]);
});
