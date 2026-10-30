"use client";

import * as React from "react";
import { calculateElapsedSec, formatTimer, useNow } from "@/shared/lib/clock";
import { cn } from "@/shared/lib/cn";

export interface ElapsedTimerProps {
  createdAt: string;
  className?: string;
}

/**
 * Cronômetro de espera. É o único trecho do card que re-renderiza a cada
 * segundo (useNow), em vez da página inteira com todos os cards.
 */
export function ElapsedTimer({ createdAt, className }: ElapsedTimerProps) {
  useNow();
  const timerDisplay = formatTimer(calculateElapsedSec(createdAt));

  return (
    <div
      className={cn(className)}
      aria-label={`Tempo decorrido: ${timerDisplay}`}
    >
      {timerDisplay}
    </div>
  );
}
