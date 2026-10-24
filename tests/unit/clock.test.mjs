// Testes unitários com o executor nativo do Node (node:test), sem dependências novas.
// O Node 24 remove os tipos do .ts na importação.
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTimer } from "../../src/shared/lib/clock.ts";

test("formatTimer: abaixo de 60 min mantém mm:ss", () => {
  assert.equal(formatTimer(0), "00:00");
  assert.equal(formatTimer(5), "00:05");
  assert.equal(formatTimer(65), "01:05");
  assert.equal(formatTimer(3599), "59:59");
});

test("formatTimer: a partir de 60 min usa h:mm:ss (DESIGN_PLAN Q9)", () => {
  assert.equal(formatTimer(3600), "1:00:00");
  assert.equal(formatTimer(3726), "1:02:06");
  assert.equal(formatTimer(36000 + 59), "10:00:59");
});

test("formatTimer: valores negativos e fracionários", () => {
  assert.equal(formatTimer(-10), "00:00");
  assert.equal(formatTimer(65.9), "01:05");
});
