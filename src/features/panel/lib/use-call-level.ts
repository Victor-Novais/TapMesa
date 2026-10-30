"use client";

import * as React from "react";
import { calculateElapsedSec } from "@/shared/lib/clock";
import {
  getCallLevel,
  msUntilNextLevel,
  type CallLevel,
  type CallLevelThresholds,
} from "./call-level";

/**
 * Nível do chamado (normal/alerta/urgente). Agenda um único timer para a
 * próxima troca de nível: o card re-renderiza só nessa hora, e não a cada
 * segundo (o cronômetro fica isolado no ElapsedTimer).
 */
export function useCallLevel(
  createdAt: string,
  thresholds: CallLevelThresholds,
): CallLevel {
  const [, setTransitions] = React.useState(0);
  const level = getCallLevel(calculateElapsedSec(createdAt), thresholds);

  React.useEffect(() => {
    const delay = msUntilNextLevel(calculateElapsedSec(createdAt), thresholds);
    if (delay === null) return;
    // +250 ms de folga para o segundo já ter virado no relógio do servidor
    const timer = setTimeout(() => {
      setTransitions((n) => n + 1);
    }, delay + 250);
    return () => clearTimeout(timer);
  }, [createdAt, thresholds, level]);

  return level;
}
