"use client";

import * as React from "react";
import {
  TableThemeProvider,
  TableScreen,
  PendingCallCard,
  AttendedCallCard,
} from "@/features/table-screen";
import { Bell, Receipt, Wifi, Battery, Sparkles } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { RestaurantAppearance, PublicCallDto } from "@/shared/types/api";

export type PreviewScenario = "idle" | "pending" | "attended";

export interface LivePhonePreviewProps {
  appearance: RestaurantAppearance;
  tableNumber?: number;
  className?: string;
}

const STATIC_NOW = 1792584000000;
const STATIC_CREATED_AT = new Date(STATIC_NOW - 35_000).toISOString();
const STATIC_ATTENDED_CREATED = new Date(STATIC_NOW - 150_000).toISOString();
const STATIC_ATTENDED_AT = new Date(STATIC_NOW - 20_000).toISOString();
const STATIC_DEADLINE = new Date(STATIC_NOW + 100_000).toISOString();

export function LivePhonePreview({
  appearance,
  tableNumber = 4,
  className,
}: LivePhonePreviewProps) {
  const [scenario, setScenario] = React.useState<PreviewScenario>("idle");

  const waiterButtonText = appearance.texts.callWaiterButton || "Chamar Garçom";
  const billButtonText = appearance.texts.requestBillButton || "Pedir a Conta";

  const mockPendingCall = React.useMemo<PublicCallDto>(
    () => ({
      id: "preview-pending-1",
      type: "WAITER",
      status: "PENDING",
      createdAt: STATIC_CREATED_AT,
      attendedAt: null,
      rating: null,
      reopenCount: 0,
      serverNow: STATIC_CREATED_AT,
      note: null,
    }),
    [],
  );

  const mockAttendedCall = React.useMemo<PublicCallDto>(
    () => ({
      id: "preview-attended-1",
      type: "WAITER",
      status: "ATTENDED",
      createdAt: STATIC_ATTENDED_CREATED,
      attendedAt: STATIC_ATTENDED_AT,
      rating: null,
      reopenCount: 0,
      confirmationDeadline: STATIC_DEADLINE,
      serverNow: STATIC_ATTENDED_AT,
      note: null,
    }),
    [],
  );

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Controles de Cenário da Mesa */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-semibold text-ink-2">
          Simular Estado da Mesa do Cliente:
        </span>
        <div className="flex items-center gap-1 rounded-control bg-nav p-1">
          <button
            type="button"
            onClick={() => setScenario("idle")}
            className={cn(
              "rounded-control px-3 py-1 text-xs font-semibold transition-colors",
              scenario === "idle"
                ? "bg-surface text-ink shadow-elevation-1"
                : "text-ink-2 hover:text-ink",
            )}
          >
            Livre
          </button>
          <button
            type="button"
            onClick={() => setScenario("pending")}
            className={cn(
              "rounded-control px-3 py-1 text-xs font-semibold transition-colors",
              scenario === "pending"
                ? "bg-surface text-ink shadow-elevation-1"
                : "text-ink-2 hover:text-ink",
            )}
          >
            Pendente
          </button>
          <button
            type="button"
            onClick={() => setScenario("attended")}
            className={cn(
              "rounded-control px-3 py-1 text-xs font-semibold transition-colors",
              scenario === "attended"
                ? "bg-surface text-ink shadow-elevation-1"
                : "text-ink-2 hover:text-ink",
            )}
          >
            Atendido
          </button>
        </div>
      </div>

      {/* Mockup do Smartphone (Moldura Física Realista) */}
      <div className="relative mx-auto w-[330px] sm:w-[360px] h-[670px] overflow-hidden rounded-[48px] border-[10px] border-black bg-black p-1 shadow-elevation-3 ring-1 ring-border select-none">
        {/* Dynamic Island / Notch do Topo */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex h-5 w-24 items-center justify-between rounded-full bg-black px-2">
          <div className="h-2.5 w-2.5 rounded-full bg-black ring-1 ring-white/10" />
          <div className="h-2 w-2 rounded-full bg-white/10" />
        </div>

        {/* Barra de Status Superior */}
        <div className="absolute top-2 left-6 right-6 z-20 flex items-center justify-between text-xs font-bold text-ink pointer-events-none opacity-80 pt-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Tela Interna do Dispositivo */}
        <div className="relative h-full w-full overflow-y-auto rounded-[38px] overflow-x-hidden bg-surface no-scrollbar">
          <TableThemeProvider appearance={appearance}>
            <TableScreen
              tableNumber={tableNumber}
              appearance={appearance}
              available={true}
              connectionStatus="connected"
            >
              {/* Conteúdo específico por cenário simulado */}
              {scenario === "idle" && (
                <div className="space-y-4 pt-2">
                  {/* Botão Chamar Garçom */}
                  <button
                    type="button"
                    style={{
                      backgroundColor: appearance.colors?.primary || "#C4452D",
                      color: appearance.colors?.primaryText || "#ffffff",
                    }}
                    className="flex h-16 w-full items-center justify-center gap-3 rounded-card px-6 text-base font-bold shadow-elevation-1 transition-transform active:scale-[0.98]"
                  >
                    <Bell className="h-5 w-5" />
                    <span>{waiterButtonText}</span>
                  </button>

                  {/* Botão Pedir a Conta */}
                  <button
                    type="button"
                    style={{
                      backgroundColor:
                        appearance.colors?.secondary || "#2A2421",
                      color: "#ffffff",
                    }}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-card px-6 text-sm font-semibold shadow-elevation-1 transition-transform active:scale-[0.98]"
                  >
                    <Receipt className="h-4 w-4" />
                    <span>{billButtonText}</span>
                  </button>
                </div>
              )}

              {scenario === "pending" && (
                <div className="pt-2">
                  <PendingCallCard
                    call={mockPendingCall}
                    token="preview-token"
                    showWaitTimeToCustomer={true}
                    texts={appearance.texts}
                  />
                </div>
              )}

              {scenario === "attended" && (
                <div className="pt-2">
                  <AttendedCallCard
                    call={mockAttendedCall}
                    token="preview-token"
                    texts={appearance.texts}
                  />
                </div>
              )}
            </TableScreen>
          </TableThemeProvider>
        </div>

        {/* Barra de Navegação Inferior (Home Bar) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 h-1 w-32 rounded-full bg-black/40 pointer-events-none" />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-ink-2 text-center">
        <Sparkles className="h-3 w-3 text-primary-ink" />
        <span>
          Pré-visualização fiel ao smartphone do cliente na Mesa {tableNumber}
        </span>
      </div>
    </div>
  );
}
