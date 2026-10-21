export { usePanelStore } from "./model/panel-store";
export type { PanelThresholds, PanelCounters } from "./model/panel-store";
export { usePanelStream } from "./api/use-panel-stream";
export type { UsePanelStreamOptions } from "./api/use-panel-stream";
export { usePanelActions } from "./api/use-panel-actions";

export { PanelHeader } from "./ui/panel-header";
export type { PanelHeaderProps } from "./ui/panel-header";
export { PanelCallCard } from "./ui/panel-call-card";
export type { PanelCallCardProps } from "./ui/panel-call-card";
export { RecentCallsDrawer } from "./ui/recent-calls-drawer";
export type { RecentCallsDrawerProps } from "./ui/recent-calls-drawer";

// F11: Modo Operação (Áudio, Voz, Wake Lock, PWA e Diálogos)
export {
  unlockAudio,
  playWaiterSound,
  playBillSound,
  playUrgentSound,
  speakText,
  stopSpeech,
  getSavedAudioPreferences,
  saveAudioPreferences,
  DEFAULT_AUDIO_PREFERENCES,
} from "./lib/panel-audio";
export type { PanelAudioPreferences } from "./lib/panel-audio";

export { useWakeLock } from "./lib/use-wake-lock";
export type { UseWakeLockResult } from "./lib/use-wake-lock";

export { usePanelAudio } from "./lib/use-panel-audio";
export type { UsePanelAudioResult } from "./lib/use-panel-audio";

export { usePwa } from "./lib/use-pwa";
export type { UsePwaResult } from "./lib/use-pwa";

export { PanelStartDialog } from "./ui/panel-start-dialog";
export type { PanelStartDialogProps } from "./ui/panel-start-dialog";

export { PanelSettingsDialog } from "./ui/panel-settings-dialog";
export type { PanelSettingsDialogProps } from "./ui/panel-settings-dialog";

export { PwaInstallPrompt } from "./ui/pwa-install-prompt";
export type { PwaInstallPromptProps } from "./ui/pwa-install-prompt";
