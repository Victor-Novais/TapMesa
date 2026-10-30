"use client";

import * as React from "react";
import { Sparkles, RefreshCw, CheckCircle2, AlertOctagon } from "lucide-react";
import {
  usePanelStore,
  usePanelStream,
  usePanelActions,
  PanelHeader,
  PanelCallCard,
  RecentCallsDrawer,
  usePanelAudio,
  useWakeLock,
  usePwa,
  unlockAudio,
  PanelStartDialog,
  PanelSettingsDialog,
  PwaInstallPrompt,
} from "@/features/panel";
import { useAuth } from "@/features/auth";
import { UserMenu } from "@/app/_components/user-menu";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/toast";
import { formatTimer } from "@/shared/lib/clock";
import type { AlertRaisedEventData } from "@/shared/types/api";
import { Card } from "@/shared/ui/card";
import { SkipLink } from "@/shared/ui/skip-link";
import { useShallow } from "zustand/react/shallow";

const emptySubscribe = () => () => {};

export default function PanelOperationalPage() {
  const { user } = useAuth();
  const currentUserId = user?.sub;

  // Sincronização segura de montagem no cliente e verificação de gesto inicial
  const isClientReady = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const hasStartedFromStorage = React.useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem("tapmesa:panel-started") === "true",
    () => false,
  );

  const [startedManually, setStartedManually] = React.useState(false);
  const hasStarted = startedManually || hasStartedFromStorage;

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = React.useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Ignora bloqueio de tela cheia
    }
  }, []);

  // Modal de configurações do painel
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);

  // Áudio, sintetizador Web Audio e fila de voz pt-BR
  const audio = usePanelAudio(hasStarted);

  // Screen Wake Lock API (mantém a tela ligada o dia todo e readquire ao voltar à aba)
  const wakeLock = useWakeLock(hasStarted);

  // Suporte a PWA e Service Worker
  const { isInstallable, installApp } = usePwa();

  // Alerta de urgência enviado pelo back (`alert.raised`)
  const { toast } = useToast();
  const { playUrgentAlert } = audio;
  const handleAlertRaised = React.useCallback(
    (alert: AlertRaisedEventData) => {
      playUrgentAlert();
      toast({
        title: `Mesa ${alert.tableNumber}: espera urgente`,
        description: `${alert.callType === "BILL" ? "Pedido de conta" : "Chamado de garçom"} aguardando há ${formatTimer(alert.waitDurationSec)}.`,
        type: "error",
      });
    },
    [playUrgentAlert, toast],
  );

  // Conexão SSE em tempo real com ticket de uso único e fallback para polling
  const { isPollingFallback, reconnect } = usePanelStream({
    onAlertRaised: handleAlertRaised,
  });

  const { calls, recent, counters, thresholds, connectionStatus } =
    usePanelStore(
      useShallow((s) => ({
        calls: s.calls,
        recent: s.recent,
        counters: s.counters,
        thresholds: s.thresholds,
        connectionStatus: s.connectionStatus,
      })),
    );
  const { assumeCall, attendCall, loadRecent, isLoadingRecent, isSubmitting } =
    usePanelActions();

  // Sem useNow() aqui: o cronômetro de cada card (ElapsedTimer) e o relógio do
  // header atualizam sozinhos, sem re-renderizar a página inteira a cada segundo

  // Estado da gaveta de recentes
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Acessibilidade: anúncio via aria-live para leitores de tela
  const [announcement, setAnnouncement] = React.useState<string>("");
  const prevCallsCountRef = React.useRef(calls.length);

  React.useEffect(() => {
    if (calls.length > prevCallsCountRef.current) {
      const newestCall = calls[calls.length - 1];
      if (newestCall) {
        const typeLabel =
          newestCall.type === "BILL" ? "Pedido de conta" : "Chamado de garçom";
        const timer = setTimeout(() => {
          setAnnouncement(
            `Novo chamado: Mesa ${newestCall.tableNumber}, ${typeLabel}.`,
          );
        }, 0);
        prevCallsCountRef.current = calls.length;
        return () => clearTimeout(timer);
      }
    }
    prevCallsCountRef.current = calls.length;
  }, [calls]);

  // Carrega lista inicial de chamados recentes para a gaveta
  React.useEffect(() => {
    void loadRecent(15);
  }, [loadRecent]);

  // Função disparada no toque inicial de "Iniciar Painel"
  const handleStartPanel = React.useCallback(
    async (enableFullscreen: boolean) => {
      // 1. Libera o áudio do navegador
      await unlockAudio();

      // 2. Solicita Wake Lock para manter a tela sempre ligada
      await wakeLock.request();

      // 3. Entra em tela cheia se solicitado
      if (enableFullscreen) {
        try {
          if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          }
        } catch {
          // Ignora se bloqueado pelo navegador
        }
      }

      setStartedManually(true);
      try {
        sessionStorage.setItem("tapmesa:panel-started", "true");
      } catch {
        // Ignora restrições de sessionStorage
      }
    },
    [wakeLock],
  );

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <SkipLink targetId="main-content" />

      {/* Header Operacional Integrado com atalhos de som, tela cheia, gaveta e configurações */}
      <PanelHeader
        connectionStatus={connectionStatus}
        counters={counters}
        recentCount={recent.length}
        onOpenRecent={() => setIsDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMuted={audio.preferences.isMuted}
        onToggleMute={audio.toggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        userMenu={<UserMenu />}
      />

      {/* Região oculta para leitores de tela anunciarem novos chamados */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Margem de segurança / overscan para TV e monitores (2% a 3% nas bordas) */}
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-[3840px] flex-1 space-y-4 px-4 py-4 focus:outline-none sm:px-6 sm:py-6 md:px-8 xl:px-12 2xl:px-16"
      >
        {/* Banner de Instalação do PWA (aparece se suportado e ainda não instalado) */}
        <PwaInstallPrompt
          isInstallable={isInstallable}
          onInstall={installApp}
        />

        {/* Faixa Persistente de Desconexão Crítica (Passo 5 / RF-D18) */}
        {connectionStatus === "offline" && (
          <aside
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-danger px-4 py-3 text-on-danger shadow-elevation-2 animate-in fade-in-0 duration-200 sm:px-5"
          >
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-6 w-6 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-bold sm:text-base">
                  Painel Desconectado — Chamados podem não aparecer
                </p>
                <p className="text-xs font-medium opacity-90 sm:text-sm">
                  Verifique a conexão de rede da estação ou reconecte
                  manualmente.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reconnect}
              className="h-11 border-white bg-white px-4 text-sm font-semibold text-danger-ink hover:bg-white/90 hover:text-danger-ink"
            >
              Reconectar Agora
            </Button>
          </aside>
        )}

        {/* Banner de Contingência: Polling Fallback (SSE indisponível) */}
        {isPollingFallback && connectionStatus !== "offline" && (
          <aside
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning/40 bg-warning-tint px-4 py-3 text-warning-ink sm:px-5"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-xs sm:text-sm font-semibold">
                Conexão em tempo real instável. Operando em modo de contingência
                com atualização a cada 10s.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={reconnect}
              className="h-11 bg-surface px-4 text-sm font-semibold"
            >
              Reconectar SSE
            </Button>
          </aside>
        )}

        {/* Fila Operacional de Chamados */}
        <section
          aria-label="Fila operacional de chamados ativos"
          className="space-y-4"
        >
          {calls.length === 0 ? (
            /* Estado Vazio Positivo (Tudo em dia!) */
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center sm:p-12">
              <Sparkles
                className="h-10 w-10 text-success"
                strokeWidth={1.75}
                aria-hidden
              />

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-balance text-ink sm:text-3xl">
                Tudo em dia no salão!
              </h2>

              <p className="mt-2 max-w-md text-base leading-relaxed text-pretty text-ink-2">
                Não há chamados de garçom ou pedidos de conta aguardando
                atendimento neste momento.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                  <span>Ver últimos atendimentos ({recent.length})</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={reconnect}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  Atualizar status
                </Button>
              </div>
            </Card>
          ) : (
            /* Grade de Cards Operacionais:
               - Mobile (< 640px): 1 coluna
               - Tablet Retrato (640px-1024px): 2 colunas
               - Tablet Paisagem / Desktop (1024px-1919px): 3 colunas
               - TV (>= 1920px): 4 colunas; >= 2560px: 5 colunas
            */
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-5">
              {calls.map((call) => (
                <PanelCallCard
                  key={call.id}
                  call={call}
                  thresholds={thresholds}
                  onAssume={assumeCall}
                  onAttend={attendCall}
                  isSubmitting={isSubmitting(call.id)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Gaveta de Chamados Recentes (Bottom sheet no mobile, lateral a partir de tablet) */}
      <RecentCallsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        recentCalls={recent}
        onRefresh={() => void loadRecent(15)}
        isLoading={isLoadingRecent}
      />

      {/* Modal Inicial "Iniciar Painel" (Passo 1: exige gesto do usuário para liberar áudio, tela cheia e wake lock) */}
      {isClientReady && (
        <PanelStartDialog open={!hasStarted} onStart={handleStartPanel} />
      )}

      {/* Diálogo de Configurações do Painel (Volume, mudo, voz, repetição de urgente e testes) */}
      <PanelSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        audio={audio}
        wakeLock={wakeLock}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
