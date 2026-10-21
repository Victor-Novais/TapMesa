"use client";

import * as React from "react";
import {
  Volume2,
  VolumeX,
  Volume1,
  Mic,
  MicOff,
  Bell,
  Receipt,
  Flame,
  Maximize2,
  Minimize2,
  SunMedium,
  Settings,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import type { UsePanelAudioResult } from "../lib/use-panel-audio";
import type { UseWakeLockResult } from "../lib/use-wake-lock";

export interface PanelSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audio: UsePanelAudioResult;
  wakeLock: UseWakeLockResult;
  isFullscreen: boolean;
  onToggleFullscreen: () => Promise<void>;
}

export function PanelSettingsDialog({
  open,
  onOpenChange,
  audio,
  wakeLock,
  isFullscreen,
  onToggleFullscreen,
}: PanelSettingsDialogProps) {
  const {
    preferences,
    setVolume,
    toggleMute,
    toggleVoice,
    setUrgentInterval,
    testSound,
    testVoice,
  } = audio;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-3xl space-y-5">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
              <Settings className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Configurações do Painel
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Ajustes locais de som, voz e comportamento para esta tela.
          </DialogDescription>
        </DialogHeader>

        {/* Volume & Mute Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {preferences.isMuted ? (
                <VolumeX className="h-4 w-4 text-red-500" />
              ) : preferences.volume > 50 ? (
                <Volume2 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              ) : (
                <Volume1 className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
              )}
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Silenciar Todos os Sons
              </span>
            </div>
            <Switch
              checked={preferences.isMuted}
              onCheckedChange={toggleMute}
              aria-label="Silenciar som do painel"
            />
          </div>

          {!preferences.isMuted && (
            <div className="space-y-2 rounded-2xl bg-zinc-50 p-3.5 border border-zinc-100 dark:bg-zinc-800/60 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Volume dos Alertas</span>
                <span className="font-mono">{preferences.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={preferences.volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume dos alertas sonoros"
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-600 dark:bg-zinc-700"
              />
            </div>
          )}

          {/* Voice Announcement Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {preferences.voiceEnabled ? (
                <Mic className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              ) : (
                <MicOff className="h-4 w-4 text-zinc-400" />
              )}
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Voz em Português
                </p>
                <p className="text-[11px] text-zinc-500">
                  Anuncia &ldquo;Mesa X chama o garçom&rdquo;
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.voiceEnabled}
              onCheckedChange={toggleVoice}
              disabled={preferences.isMuted}
              aria-label="Ativar voz em português"
            />
          </div>

          {/* Urgent Repeat Interval */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Repetição do Alarme Urgente
              </span>
              <span className="font-mono text-xs text-zinc-500">
                a cada {preferences.urgentIntervalSec}s
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((sec) => (
                <Button
                  key={sec}
                  type="button"
                  size="sm"
                  variant={
                    preferences.urgentIntervalSec === sec
                      ? "primary"
                      : "outline"
                  }
                  onClick={() => setUrgentInterval(sec)}
                  className="h-8 text-xs font-bold"
                >
                  {sec} seg
                </Button>
              ))}
            </div>
          </div>

          {/* Sound Test Panel */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500">
              Testar Sons e Voz
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={preferences.isMuted}
                onClick={() => testSound("WAITER")}
                className="text-xs font-bold gap-1.5 h-9"
              >
                <Bell className="h-3.5 w-3.5 text-orange-600" />
                <span>Garçom</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={preferences.isMuted}
                onClick={() => testSound("BILL")}
                className="text-xs font-bold gap-1.5 h-9"
              >
                <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                <span>Conta</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={preferences.isMuted}
                onClick={() => testSound("URGENT")}
                className="text-xs font-bold gap-1.5 h-9"
              >
                <Flame className="h-3.5 w-3.5 text-red-600" />
                <span>Urgente</span>
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={preferences.isMuted || !preferences.voiceEnabled}
                onClick={testVoice}
                className="text-xs font-bold gap-1.5 h-9"
              >
                <Mic className="h-3.5 w-3.5 text-orange-600" />
                <span>Falar</span>
              </Button>
            </div>
          </div>

          {/* Hardware & Display Controls */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <SunMedium className="h-3.5 w-3.5 text-amber-500" />
                <span>Tela Sempre Ligada (Wake Lock)</span>
              </span>
              <Badge
                variant={wakeLock.isActive ? "success" : "neutral"}
                className="text-[10px]"
              >
                {wakeLock.isActive
                  ? "Ativo"
                  : wakeLock.isSupported
                    ? "Inativo"
                    : "Não suportado"}
              </Badge>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onToggleFullscreen}
              className="w-full text-xs font-bold gap-2 h-9"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Sair da Tela Cheia</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Entrar em Tela Cheia</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
