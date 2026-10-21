"use client";

import * as React from "react";
import {
  type PanelAudioPreferences,
  getSavedAudioPreferences,
  saveAudioPreferences,
  playWaiterSound,
  playBillSound,
  playUrgentSound,
  speakText,
  stopSpeech,
} from "./panel-audio";
import { usePanelStore } from "../model/panel-store";
import { calculateElapsedSec, useNow } from "@/shared/lib/clock";
import type { PanelCallDto } from "@/shared/types/api";

export interface UsePanelAudioResult {
  preferences: PanelAudioPreferences;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleVoice: () => void;
  setUrgentInterval: (sec: number) => void;
  testSound: (type: "WAITER" | "BILL" | "URGENT") => void;
  testVoice: () => void;
}

export function usePanelAudio(isEnabled = true): UsePanelAudioResult {
  // Inicialização lazy das preferências persistidas
  const [preferences, setPreferences] = React.useState<PanelAudioPreferences>(
    () => getSavedAudioPreferences(),
  );

  const { calls, thresholds } = usePanelStore();
  const knownCallIdsRef = React.useRef<Set<string>>(new Set());
  const isInitialLoadRef = React.useRef(true);

  // Atualiza preferências e persiste
  const updatePreferences = React.useCallback(
    (updater: (prev: PanelAudioPreferences) => PanelAudioPreferences) => {
      setPreferences((prev) => {
        const next = updater(prev);
        saveAudioPreferences(next);
        if (next.isMuted) {
          stopSpeech();
        }
        return next;
      });
    },
    [],
  );

  const setVolume = React.useCallback(
    (volume: number) => {
      updatePreferences((prev) => ({
        ...prev,
        volume: Math.max(0, Math.min(100, volume)),
      }));
    },
    [updatePreferences],
  );

  const toggleMute = React.useCallback(() => {
    updatePreferences((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  }, [updatePreferences]);

  const toggleVoice = React.useCallback(() => {
    updatePreferences((prev) => ({
      ...prev,
      voiceEnabled: !prev.voiceEnabled,
    }));
  }, [updatePreferences]);

  const setUrgentInterval = React.useCallback(
    (sec: number) => {
      updatePreferences((prev) => ({
        ...prev,
        urgentIntervalSec: Math.max(10, sec),
      }));
    },
    [updatePreferences],
  );

  const testSound = React.useCallback(
    (type: "WAITER" | "BILL" | "URGENT") => {
      if (type === "WAITER") playWaiterSound(preferences.volume);
      else if (type === "BILL") playBillSound(preferences.volume);
      else playUrgentSound(preferences.volume);
    },
    [preferences.volume],
  );

  const testVoice = React.useCallback(() => {
    speakText("Teste de voz do painel TapMesa. Mesa 5 chama o garçom.");
  }, []);

  // Monitoramento de Novos Chamados (Detecção de delta para som e fala)
  React.useEffect(() => {
    if (!isEnabled) return;

    const currentKnown = knownCallIdsRef.current;

    // Na primeira carga dos chamados existentes, popula o set sem disparar todos os sons de uma vez
    if (isInitialLoadRef.current) {
      calls.forEach((c) => currentKnown.add(c.id));
      isInitialLoadRef.current = false;
      return;
    }

    // Identifica chamados recém-chegados
    const newCalls: PanelCallDto[] = [];
    calls.forEach((call) => {
      if (!currentKnown.has(call.id)) {
        currentKnown.add(call.id);
        newCalls.push(call);
      }
    });

    // Remove chamados finalizados do set para liberar memória
    const activeIds = new Set(calls.map((c) => c.id));
    currentKnown.forEach((id) => {
      if (!activeIds.has(id)) {
        currentKnown.delete(id);
      }
    });

    if (newCalls.length === 0 || preferences.isMuted) return;

    // Dispara som e voz para os novos chamados
    newCalls.forEach((call) => {
      if (call.type === "BILL") {
        playBillSound(preferences.volume);
      } else {
        playWaiterSound(preferences.volume);
      }

      if (preferences.voiceEnabled) {
        const typeSpeech =
          call.type === "BILL" ? "pede a conta" : "chama o garçom";
        const noteSpeech = call.note ? " com observação" : "";
        speakText(`Mesa ${call.tableNumber} ${typeSpeech}${noteSpeech}.`);
      }
    });
  }, [
    calls,
    isEnabled,
    preferences.isMuted,
    preferences.volume,
    preferences.voiceEnabled,
  ]);

  // Alarme recorrente para chamados Urgentes enquanto houver algum na fila
  useNow(); // Garante verificação periódica

  React.useEffect(() => {
    if (!isEnabled || preferences.isMuted) return;

    const hasUrgent = calls.some(
      (c) => calculateElapsedSec(c.createdAt) >= thresholds.urgentSec,
    );

    if (!hasUrgent) return;

    // Toca o alarme imediatamente e agenda a repetição no intervalo configurado
    playUrgentSound(preferences.volume);

    const intervalMs = preferences.urgentIntervalSec * 1000;
    const intervalId = setInterval(() => {
      playUrgentSound(preferences.volume);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [
    calls,
    thresholds.urgentSec,
    isEnabled,
    preferences.isMuted,
    preferences.volume,
    preferences.urgentIntervalSec,
  ]);

  return {
    preferences,
    setVolume,
    toggleMute,
    toggleVoice,
    setUrgentInterval,
    testSound,
    testVoice,
  };
}
