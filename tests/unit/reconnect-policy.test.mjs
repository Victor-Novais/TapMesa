// Reconexão do stream da mesa (DIAGNOSTICO_E_PLANO_DE_ACAO.md, Fase 2).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_RETRY_DELAY_MS,
  MAX_RETRY_DELAY_MS,
  nextRetryDelay,
  statusAfterFailure,
  withJitter,
} from "../../src/features/table-screen/lib/reconnect-policy.ts";

test("reconexão: atraso começa em 2 s, dobra e para em 30 s", () => {
  const delays = [];
  let delay = INITIAL_RETRY_DELAY_MS;
  for (let i = 0; i < 6; i += 1) {
    delays.push(delay);
    delay = nextRetryDelay(delay);
  }
  assert.deepEqual(delays, [2000, 4000, 8000, 16000, 30000, 30000]);
  assert.equal(nextRetryDelay(MAX_RETRY_DELAY_MS), MAX_RETRY_DELAY_MS);
});

test("reconexão: jitter fica entre 70% e 130% do atraso", () => {
  assert.equal(withJitter(10_000, 0), 7_000);
  assert.equal(withJitter(10_000, 0.5), 10_000);
  assert.ok(withJitter(10_000, 0.999999) <= 13_000);
  for (let i = 0; i < 200; i += 1) {
    const value = withJitter(10_000);
    assert.ok(value >= 7_000 && value <= 13_000, `fora da faixa: ${value}`);
  }
});

test("reconexão: com a API fora por 60 s a mesa tenta no máximo ~6 vezes", () => {
  // Pior caso: jitter sempre no mínimo (tentativas mais frequentes)
  let elapsed = 0;
  let attempts = 0;
  let delay = INITIAL_RETRY_DELAY_MS;
  while (true) {
    elapsed += withJitter(delay, 0);
    if (elapsed > 60_000) break;
    attempts += 1;
    delay = nextRetryDelay(delay);
  }
  assert.ok(attempts <= 7, `tentativas: ${attempts}`);
});

test("status: falhas isoladas mostram Reconectando; sem rede ou 3 falhas, Sem conexão", () => {
  assert.equal(statusAfterFailure(1, true), "reconnecting");
  assert.equal(statusAfterFailure(2, true), "reconnecting");
  assert.equal(statusAfterFailure(3, true), "offline");
  assert.equal(statusAfterFailure(1, false), "offline");
});
