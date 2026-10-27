// Regras da tela da mesa para conta paga (docs/api/FEATURE_GOOGLE_REVIEW.md, T4 e T5).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONFIRMED_AUTO_DISMISS_MS,
  dismissedStorageKey,
  readDismissedIds,
  shouldApplyAttendedEvent,
  shouldAutoDismissConfirmed,
  writeDismissedIds,
} from "../../src/features/table-screen/lib/call-state.ts";

const REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJIX22n_zVbgcRWvn7GCPGrs4";

const call = (id, type, status = "PENDING") => ({ id, type, status });

test("card de confirmação: conta com link não fecha sozinho", () => {
  assert.equal(shouldAutoDismissConfirmed("bill", REVIEW_URL), false);
});

test("card de confirmação: sem link ou para garçom fecha após 3,5 s", () => {
  assert.equal(CONFIRMED_AUTO_DISMISS_MS, 3500);
  assert.equal(shouldAutoDismissConfirmed("bill", null), true);
  assert.equal(shouldAutoDismissConfirmed("bill", undefined), true);
  assert.equal(shouldAutoDismissConfirmed("bill", ""), true);
  assert.equal(shouldAutoDismissConfirmed("waiter", REVIEW_URL), true);
  assert.equal(shouldAutoDismissConfirmed("waiter", null), true);
});

test("call.attended: ignorado para conta, aplicado para garçom", () => {
  const calls = [call("bill-1", "BILL"), call("waiter-1", "WAITER")];
  assert.equal(shouldApplyAttendedEvent(calls, "bill-1"), false);
  assert.equal(shouldApplyAttendedEvent(calls, "waiter-1"), true);
});

test("call.attended: chamado desconhecido ou sem cache segue o fluxo normal", () => {
  assert.equal(shouldApplyAttendedEvent([], "x"), true);
  assert.equal(shouldApplyAttendedEvent(undefined, "x"), true);
});

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
  };
}

test("cards fechados: grava e lê por mesa no sessionStorage", () => {
  const storage = memoryStorage();
  writeDismissedIds(storage, "tok", new Set(["a", "b"]));
  assert.equal(dismissedStorageKey("tok"), "tapmesa:dismissed:tok");
  assert.deepEqual([...readDismissedIds(storage, "tok")], ["a", "b"]);
  assert.equal(readDismissedIds(storage, "outra").size, 0);
});

test("cards fechados: storage bloqueado ou corrompido não quebra a tela", () => {
  const throwing = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
  assert.equal(readDismissedIds(throwing, "tok").size, 0);
  assert.doesNotThrow(() => writeDismissedIds(throwing, "tok", new Set(["a"])));
  assert.equal(readDismissedIds(undefined, "tok").size, 0);

  const storage = memoryStorage();
  storage.setItem("tapmesa:dismissed:tok", "{não é json");
  assert.equal(readDismissedIds(storage, "tok").size, 0);
  storage.setItem("tapmesa:dismissed:tok", JSON.stringify(["ok", 1, null]));
  assert.deepEqual([...readDismissedIds(storage, "tok")], ["ok"]);
});
