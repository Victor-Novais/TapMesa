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
import { Card } from "@/shared/ui/card";
import { SkipLink } from "@/shared/ui/skip-link";
import { useNow } from "@/shared/lib/clock";

const emptySubscribe = () => () => {};

export default function PanelOperationalPage() {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.sub;

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

  // Conexão SSE em tempo real com ticket de uso único e fallback para polling
  const { isPollingFallback, reconnect } = usePanelStream();

  const { calls, recent, counters, thresholds, connectionStatus } =
    usePanelStore();
  const { assumeCall, attendCall, loadRecent, isLoadingRecent, isSubmitting } =
    usePanelActions();

  // Tick do relógio compartilhado (sincronizado com serverNow)
  useNow();

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
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
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
        className="flex-1 w-full max-w-[3840px] mx-auto px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 py-4 sm:py-6 space-y-4 focus:outline-none"
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-red-600 bg-red-600 px-4 sm:px-5 py-3 text-white shadow-lg animate-in fade-in"
          >
            <div className="flex items-center gap-3">
              <AlertOctagon className="h-5 w-5 shrink-0 animate-bounce text-white" />
              <div>
                <p className="text-xs sm:text-sm font-black tracking-wide uppercase">
                  Painel Desconectado — Chamados podem não aparecer
                </p>
                <p className="text-[11px] sm:text-xs text-red-100 font-medium">
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
              className="h-8 text-xs font-black uppercase bg-white text-red-700 hover:bg-red-50 border-white shadow-sm"
            >
              Reconectar Agora
            </Button>
          </aside>
        )}

        {/* Banner de Contingência: Polling Fallback (SSE indisponível) */}
        {isPollingFallback && connectionStatus !== "offline" && (
          <aside
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 sm:px-5 py-3 text-amber-900 shadow-sm dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
          >
            <div className="flex items-center gap-2.5">
              <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
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
              className="h-8 text-xs font-bold border-amber-300 bg-white hover:bg-amber-100 dark:border-amber-700 dark:bg-zinc-900 shadow-xs"
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
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 sm:p-12 text-center border-dashed border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/50 shadow-sm">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-inner dark:bg-emerald-950/50 dark:text-emerald-400 animate-in zoom-in-75 duration-300">
                <Sparkles className="h-10 w-10 animate-pulse" />
              </div>

              <h2 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Tudo em dia no salão!
              </h2>

              <p className="mt-2 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-md leading-relaxed">
                Não há chamados de garçom ou pedidos de conta aguardando
                atendimento neste momento.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-xs font-bold gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Ver últimos atendimentos ({recent.length})</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={reconnect}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Atualizar status
                </Button>
              </div>
            </Card>
          ) : (
            /* Grade de Cards Operacionais:
               - Mobile (< 640px): 1 coluna
               - Tablet Retrato (640px-1024px): 2 colunas
               - Tablet Paisagem / Desktop (1024px-1440px): 3 colunas
               - TV / Telas Grandes (>= 1440px / 1920px / 3840px): 4 a 5 colunas
            */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
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
