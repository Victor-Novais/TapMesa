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
      <DialogContent className="sm:max-w-md p-6 bg-surface border-border shadow-elevation-2 rounded-sheet space-y-5">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-control bg-brand-tint text-primary-ink">
              <Settings className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-ink">
              Configurações do Painel
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-2">
            Ajustes locais de som, voz e comportamento para esta tela.
          </DialogDescription>
        </DialogHeader>

        {/* Volume & Mute Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {preferences.isMuted ? (
                <VolumeX className="h-4 w-4 text-danger-ink" />
              ) : preferences.volume > 50 ? (
                <Volume2 className="h-4 w-4 text-ink-2" />
              ) : (
                <Volume1 className="h-4 w-4 text-ink-2" />
              )}
              <span className="text-sm font-semibold text-ink">
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
            <div className="space-y-2 rounded-card bg-nav p-3.5 border border-border-subtle">
              <div className="flex items-center justify-between text-xs font-semibold text-ink-2">
                <span>Volume dos Alertas</span>
                <span className="tabular-nums">{preferences.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={preferences.volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume dos alertas sonoros"
                className="w-full h-2 bg-nav rounded-control appearance-none cursor-pointer accent-brand"
              />
            </div>
          )}

          {/* Voice Announcement Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {preferences.voiceEnabled ? (
                <Mic className="h-4 w-4 text-primary-ink" />
              ) : (
                <MicOff className="h-4 w-4 text-ink-2" />
              )}
              <div>
                <p className="text-sm font-semibold text-ink">
                  Voz em Português
                </p>
                <p className="text-xs text-ink-2">
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
              <span className="text-xs font-semibold text-ink-2">
                Repetição do Alarme Urgente
              </span>
              <span className="tabular-nums text-xs text-ink-2">
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
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <p className="text-xs font-semibold text-ink-2">
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
                <Bell className="h-3.5 w-3.5 text-primary-ink" />
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
                <Receipt className="h-3.5 w-3.5 text-ink-2" />
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
                <Flame className="h-3.5 w-3.5 text-danger-ink" />
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
                <Mic className="h-3.5 w-3.5 text-primary-ink" />
                <span>Falar</span>
              </Button>
            </div>
          </div>

          {/* Hardware & Display Controls */}
          <div className="space-y-2 pt-2 border-t border-border-subtle">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-2 flex items-center gap-1.5">
                <SunMedium className="h-3.5 w-3.5 text-warning-ink" />
                <span>Tela Sempre Ligada (Wake Lock)</span>
              </span>
              <Badge
                variant={wakeLock.isActive ? "success" : "neutral"}
                className="text-xs"
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
