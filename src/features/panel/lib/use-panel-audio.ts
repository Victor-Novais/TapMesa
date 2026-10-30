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
import { buildCallSpeech, getCallLevel } from "./call-level";
import { calculateElapsedSec } from "@/shared/lib/clock";
import type { PanelCallDto } from "@/shared/types/api";

const URGENT_CHECK_INTERVAL_MS = 5_000;

export interface UsePanelAudioResult {
  preferences: PanelAudioPreferences;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleVoice: () => void;
  setUrgentInterval: (sec: number) => void;
  testSound: (type: "WAITER" | "BILL" | "URGENT") => void;
  testVoice: () => void;
  playUrgentAlert: () => void;
}

export function usePanelAudio(isEnabled = true): UsePanelAudioResult {
  // Inicialização lazy das preferências persistidas
  const [preferences, setPreferences] = React.useState<PanelAudioPreferences>(
    () => getSavedAudioPreferences(),
  );

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
    speakText("Teste de voz do painel Aproxime Aí. Mesa 5 chama o garçom.");
  }, []);

  // Alerta disparado pelo back (`alert.raised`); respeita o modo mudo
  const playUrgentAlert = React.useCallback(() => {
    if (!isEnabled || preferences.isMuted) return;
    playUrgentSound(preferences.volume);
  }, [isEnabled, preferences.isMuted, preferences.volume]);

  // Preferências lidas pelos efeitos de longa duração sem recriá-los
  const preferencesRef = React.useRef(preferences);
  React.useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Monitoramento de novos chamados (delta para som e fala). Assina a store
  // fora do ciclo de render: o hook não re-renderiza a página a cada evento.
  React.useEffect(() => {
    if (!isEnabled) return;

    const knownIds = new Set(usePanelStore.getState().calls.map((c) => c.id));

    return usePanelStore.subscribe((state, prev) => {
      if (state.calls === prev.calls) return;

      const newCalls: PanelCallDto[] = [];
      state.calls.forEach((call) => {
        if (!knownIds.has(call.id)) {
          knownIds.add(call.id);
          newCalls.push(call);
        }
      });

      // Remove chamados finalizados do set para liberar memória
      const activeIds = new Set(state.calls.map((c) => c.id));
      knownIds.forEach((id) => {
        if (!activeIds.has(id)) knownIds.delete(id);
      });

      const prefs = preferencesRef.current;
      if (newCalls.length === 0 || prefs.isMuted) return;

      // Um som por tipo de chamado novo (não um por chamado numa rajada)
      if (newCalls.some((c) => c.type === "BILL")) {
        playBillSound(prefs.volume);
      }
      if (newCalls.some((c) => c.type !== "BILL")) {
        playWaiterSound(prefs.volume);
      }

      if (prefs.voiceEnabled) {
        buildCallSpeech(newCalls).forEach((text) => speakText(text));
      }
    });
  }, [isEnabled]);

  // Alarme de urgente: um único intervalo verifica a fila a cada 5 s. Toca na
  // hora quando um chamado ENTRA em urgente e repete no intervalo configurado
  // enquanto houver algum urgente. Não depende de eventos chegarem.
  React.useEffect(() => {
    if (!isEnabled || preferences.isMuted) return;

    const alarmedIds = new Set<string>();
    let lastAlarmAt = 0;

    const check = () => {
      const { calls, thresholds } = usePanelStore.getState();
      const urgentIds = new Set(
        calls
          .filter(
            (c) =>
              getCallLevel(calculateElapsedSec(c.createdAt), thresholds) ===
              "urgent",
          )
          .map((c) => c.id),
      );

      alarmedIds.forEach((id) => {
        if (!urgentIds.has(id)) alarmedIds.delete(id);
      });
      if (urgentIds.size === 0) return;

      const prefs = preferencesRef.current;
      const now = Date.now();
      const hasNewUrgent = [...urgentIds].some((id) => !alarmedIds.has(id));
      const repeatDue = now - lastAlarmAt >= prefs.urgentIntervalSec * 1000;

      if (hasNewUrgent || repeatDue) {
        playUrgentSound(prefs.volume);
        lastAlarmAt = now;
      }
      urgentIds.forEach((id) => alarmedIds.add(id));
    };

    check();
    const intervalId = setInterval(check, URGENT_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isEnabled, preferences.isMuted]);

  return {
    preferences,
    setVolume,
    toggleMute,
    toggleVoice,
    setUrgentInterval,
    testSound,
    testVoice,
    playUrgentAlert,
  };
}
