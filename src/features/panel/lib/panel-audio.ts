"use client";

export interface PanelAudioPreferences {
  volume: number; // 0 to 100
  isMuted: boolean;
  voiceEnabled: boolean;
  urgentIntervalSec: number; // e.g. 15, 30, 60
}

export const DEFAULT_AUDIO_PREFERENCES: PanelAudioPreferences = {
  volume: 80,
  isMuted: false,
  voiceEnabled: true,
  urgentIntervalSec: 30,
};

const STORAGE_KEY = "tapmesa:panel-audio-pref";

/**
 * Lê preferências salvas de áudio do localStorage.
 * Contém apenas flags de preferência (volume, mudo, voz), nunca dados sensíveis.
 */
export function getSavedAudioPreferences(): PanelAudioPreferences {
  if (typeof window === "undefined") return DEFAULT_AUDIO_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUDIO_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<PanelAudioPreferences>;
    return {
      volume:
        typeof parsed.volume === "number"
          ? Math.max(0, Math.min(100, parsed.volume))
          : 80,
      isMuted: typeof parsed.isMuted === "boolean" ? parsed.isMuted : false,
      voiceEnabled:
        typeof parsed.voiceEnabled === "boolean" ? parsed.voiceEnabled : true,
      urgentIntervalSec:
        typeof parsed.urgentIntervalSec === "number"
          ? Math.max(10, parsed.urgentIntervalSec)
          : 30,
    };
  } catch {
    return DEFAULT_AUDIO_PREFERENCES;
  }
}

/**
 * Salva preferências de áudio no localStorage.
 */
export function saveAudioPreferences(pref: PanelAudioPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    // Ignora restrições de storage
  }
}

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): { ctx: AudioContext; gain: GainNode } | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) return null;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }

    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    return { ctx: audioCtx, gain: masterGain! };
  } catch {
    return null;
  }
}

/**
 * Desbloqueia o AudioContext via gesto explícito do usuário.
 */
export async function unlockAudio(): Promise<boolean> {
  const result = getAudioContext();
  if (!result) return false;
  try {
    if (result.ctx.state === "suspended") {
      await result.ctx.resume();
    }
    // Toca um tom imperceptível de 1ms para garantir liberação no iOS e Safari
    const osc = result.ctx.createOscillator();
    const g = result.ctx.createGain();
    g.gain.setValueAtTime(0.001, result.ctx.currentTime);
    osc.connect(g);
    g.connect(result.gain);
    osc.start();
    osc.stop(result.ctx.currentTime + 0.01);
    return true;
  } catch {
    return false;
  }
}

/**
 * Toca o som característico de chamado de Garçom (Arpejo suave C5 -> E5 -> G5).
 */
export function playWaiterSound(volumePercent = 80): void {
  const audio = getAudioContext();
  if (!audio) return;
  const { ctx, gain } = audio;
  const now = ctx.currentTime;
  const masterVol = Math.max(0, Math.min(1, volumePercent / 100));

  const notes = [
    { freq: 523.25, time: now }, // C5
    { freq: 659.25, time: now + 0.1 }, // E5
    { freq: 783.99, time: now + 0.2 }, // G5
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, time);

    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.3 * masterVol, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(noteGain);
    noteGain.connect(gain);

    osc.start(time);
    osc.stop(time + 0.5);
  });
}

/**
 * Toca o som característico de Pedido de Conta (Sino cristalino G5 -> C6).
 */
export function playBillSound(volumePercent = 80): void {
  const audio = getAudioContext();
  if (!audio) return;
  const { ctx, gain } = audio;
  const now = ctx.currentTime;
  const masterVol = Math.max(0, Math.min(1, volumePercent / 100));

  const notes = [
    { freq: 783.99, time: now }, // G5
    { freq: 1046.5, time: now + 0.12 }, // C6
  ];

  notes.forEach(({ freq, time }) => {
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, time);

    noteGain.gain.setValueAtTime(0, time);
    noteGain.gain.linearRampToValueAtTime(0.35 * masterVol, time + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);

    osc.connect(noteGain);
    noteGain.connect(gain);

    osc.start(time);
    osc.stop(time + 0.6);
  });
}

/**
 * Toca o som de alerta Urgente (Alarme penetrante bifônico repetido).
 */
export function playUrgentSound(volumePercent = 80): void {
  const audio = getAudioContext();
  if (!audio) return;
  const { ctx, gain } = audio;
  const now = ctx.currentTime;
  const masterVol = Math.max(0, Math.min(1, volumePercent / 100));

  const pulses = [
    { freq: 880, start: now, dur: 0.12 },
    { freq: 659.25, start: now + 0.14, dur: 0.12 },
    { freq: 880, start: now + 0.3, dur: 0.12 },
    { freq: 659.25, start: now + 0.44, dur: 0.16 },
  ];

  pulses.forEach(({ freq, start, dur }) => {
    const osc = ctx.createOscillator();
    const pulseGain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(freq, start);

    // Suaviza as harmônicas altas do square para não distorcer em caixas de TV
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, start);

    pulseGain.gain.setValueAtTime(0, start);
    pulseGain.gain.linearRampToValueAtTime(0.25 * masterVol, start + 0.015);
    pulseGain.gain.exponentialRampToValueAtTime(0.001, start + dur);

    osc.connect(filter);
    filter.connect(pulseGain);
    pulseGain.connect(gain);

    osc.start(start);
    osc.stop(start + dur + 0.05);
  });
}

// ============================================================================
// FILA DE VOZ (speechSynthesis em pt-BR)
// ============================================================================

interface SpeechQueueItem {
  text: string;
}

const speechQueue: SpeechQueueItem[] = [];
let isSpeaking = false;

function processNextSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    speechQueue.length = 0;
    isSpeaking = false;
    return;
  }

  if (speechQueue.length === 0) {
    isSpeaking = false;
    return;
  }

  isSpeaking = true;
  const next = speechQueue.shift();
  if (!next) {
    isSpeaking = false;
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(next.text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Busca preferencialmente voz brasileira instalada
    const voices = window.speechSynthesis.getVoices();
    const ptVoice =
      voices.find((v) => v.lang === "pt-BR" || v.lang === "pt_BR") ||
      voices.find((v) => v.lang.startsWith("pt"));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }

    utterance.onend = () => {
      // Pequeno intervalo entre frases para fluidez natural
      setTimeout(() => {
        processNextSpeech();
      }, 250);
    };

    utterance.onerror = () => {
      processNextSpeech();
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    isSpeaking = false;
    processNextSpeech();
  }
}

/**
 * Enfileira e pronuncia texto em pt-BR sem sobrepor falas.
 */
export function speakText(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speechQueue.push({ text });
  if (!isSpeaking) {
    processNextSpeech();
  }
}

/**
 * Interrompe qualquer fala em andamento e esvazia a fila.
 */
export function stopSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  speechQueue.length = 0;
  isSpeaking = false;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignora erro se síntese falhar
  }
}
