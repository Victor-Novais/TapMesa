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
import type {
  RestaurantAppearance,
  PublicCallDto,
  PublicTableDto,
} from "@/shared/types/api";

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

  const sanitizedAppearance = React.useMemo<
    PublicTableDto["appearance"]
  >(() => {
    return {
      restaurantName: appearance.name,
      name: appearance.name,
      description: appearance.description,
      logoUrl: appearance.logoUrl,
      backgroundType: appearance.backgroundType,
      backgroundValue: appearance.backgroundValue,
      colors: {
        primary: appearance.colors?.primary || "#ea580c",
        secondary: appearance.colors?.secondary || "#18181b",
        background: appearance.colors?.background || "#fafafa",
        text: appearance.colors?.text || "#09090b",
      },
      texts: {
        welcomeTitle:
          appearance.texts?.welcomeTitle || "Bem-vindo à Mesa {tableNumber}",
        waiterButton: appearance.texts?.waiterButton || "Chamar Garçom",
        billButton: appearance.texts?.billButton || "Pedir a Conta",
      },
      socials: {
        instagram: appearance.socials?.instagram || null,
        wifiName: appearance.socials?.wifiName || null,
        wifiPassword: appearance.socials?.wifiPassword || null,
      },
    };
  }, [appearance]);

  const waiterButtonText =
    sanitizedAppearance.texts.waiterButton || "Chamar Garçom";
  const billButtonText =
    sanitizedAppearance.texts.billButton || "Pedir a Conta";

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
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Simular Estado da Mesa do Cliente:
        </span>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setScenario("idle")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
              scenario === "idle"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            Livre
          </button>
          <button
            type="button"
            onClick={() => setScenario("pending")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
              scenario === "pending"
                ? "bg-amber-500 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            Pendente
          </button>
          <button
            type="button"
            onClick={() => setScenario("attended")}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-semibold transition-all",
              scenario === "attended"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            Atendido
          </button>
        </div>
      </div>

      {/* Mockup do Smartphone (Moldura Física Realista) */}
      <div className="relative mx-auto w-[330px] sm:w-[360px] h-[670px] overflow-hidden rounded-[48px] border-[10px] border-zinc-900 bg-zinc-950 p-1 shadow-2xl dark:border-zinc-800 ring-1 ring-zinc-700/50 select-none">
        {/* Dynamic Island / Notch do Topo */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex h-5 w-24 items-center justify-between rounded-full bg-black px-2 shadow-inner">
          <div className="h-2.5 w-2.5 rounded-full bg-zinc-900 ring-1 ring-zinc-800" />
          <div className="h-2 w-2 rounded-full bg-blue-900/40" />
        </div>

        {/* Barra de Status Superior */}
        <div className="absolute top-2 left-6 right-6 z-20 flex items-center justify-between text-[11px] font-bold text-zinc-900 dark:text-zinc-100 pointer-events-none opacity-80 pt-1">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3 w-3" />
            <Battery className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Tela Interna do Dispositivo */}
        <div className="relative h-full w-full overflow-y-auto rounded-[38px] overflow-x-hidden bg-white dark:bg-zinc-900 no-scrollbar">
          <TableThemeProvider appearance={sanitizedAppearance}>
            <TableScreen
              tableNumber={tableNumber}
              appearance={sanitizedAppearance}
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
                      backgroundColor:
                        sanitizedAppearance.colors?.primary || "#ea580c",
                      color:
                        sanitizedAppearance.colors?.primaryText || "#ffffff",
                    }}
                    className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl px-6 text-base font-bold shadow-lg transition-transform active:scale-[0.98]"
                  >
                    <Bell className="h-5 w-5" />
                    <span>{waiterButtonText}</span>
                  </button>

                  {/* Botão Pedir a Conta */}
                  <button
                    type="button"
                    style={{
                      backgroundColor:
                        sanitizedAppearance.colors?.secondary || "#18181b",
                      color: "#ffffff",
                    }}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl px-6 text-sm font-semibold shadow-md transition-transform active:scale-[0.98]"
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
                    texts={sanitizedAppearance.texts}
                  />
                </div>
              )}

              {scenario === "attended" && (
                <div className="pt-2">
                  <AttendedCallCard
                    call={mockAttendedCall}
                    token="preview-token"
                    texts={sanitizedAppearance.texts}
                  />
                </div>
              )}
            </TableScreen>
          </TableThemeProvider>
        </div>

        {/* Barra de Navegação Inferior (Home Bar) */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 h-1 w-32 rounded-full bg-zinc-600/60 pointer-events-none" />
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 text-center">
        <Sparkles className="h-3 w-3 text-orange-500" />
        <span>
          Pré-visualização fiel ao smartphone do cliente na Mesa {tableNumber}
        </span>
      </div>
    </div>
  );
}
