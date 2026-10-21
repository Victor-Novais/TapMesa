"use client";

import * as React from "react";
import Image from "next/image";
import { Wifi, Copy, Check, Phone, Globe, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  ConnectionIndicator,
  type ConnectionStatus,
} from "@/shared/ui/connection-indicator";
import type { PublicTableDto } from "@/shared/types/api";

export interface TableScreenProps {
  tableNumber: number;
  appearance: PublicTableDto["appearance"];
  available?: boolean;
  unavailableReason?: string | null;
  message?: string | null;
  connectionStatus?: ConnectionStatus;
  children?: React.ReactNode;
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function TableScreen({
  tableNumber,
  appearance,
  available = true,
  connectionStatus = "connected",
  children,
}: TableScreenProps) {
  const [copiedWifi, setCopiedWifi] = React.useState(false);

  const {
    restaurantName,
    name,
    description,
    logoUrl,
    texts = {},
    socials = {},
  } = appearance;

  const displayName = restaurantName || name || "Restaurante";

  // Interpolate welcome title with table number: "Bem-vindo à Mesa {tableNumber}"
  const rawWelcome = texts.welcomeTitle || "Mesa {tableNumber}";
  const welcomeTitle = rawWelcome.replace(
    /\{tableNumber\}|\{mesa\}|\{number\}/gi,
    String(tableNumber),
  );

  const wifiSsid = socials.wifiSsid || socials.wifi_ssid;
  const wifiPassword = socials.wifiPassword || socials.wifi_password;

  const handleCopyWifi = async () => {
    if (!wifiPassword) return;
    try {
      await navigator.clipboard.writeText(wifiPassword);
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2500);
    } catch {
      // Fallback manual se permissão for negada
    }
  };

  const getSocialLink = (
    key: string,
    val: string | null | undefined,
  ): string | null => {
    if (!val) return null;
    const clean = val.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    if (key.toLowerCase().includes("instagram")) {
      return `https://instagram.com/${clean.replace("@", "")}`;
    }
    if (key.toLowerCase().includes("whatsapp")) {
      return `https://wa.me/${clean.replace(/\D/g, "")}`;
    }
    return `https://${clean}`;
  };

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between px-4 py-6 sm:px-6 max-w-md mx-auto w-full pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* Top Header Section */}
      <header className="flex flex-col items-center text-center w-full">
        <div className="flex w-full items-center justify-between pb-4">
          <Badge
            variant="neutral"
            className="border-white/20 bg-black/10 backdrop-blur text-xs font-semibold px-2.5 py-1 text-inherit"
          >
            Mesa {tableNumber}
          </Badge>
          <ConnectionIndicator status={connectionStatus} className="text-xs" />
        </div>

        {/* Logo or Restaurant Avatar */}
        <div className="mt-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/90 shadow-md backdrop-blur overflow-hidden border border-white/20 dark:bg-zinc-900/90 dark:border-zinc-800">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`Logotipo ${displayName}`}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-orange-600 text-white">
              <UtensilsCrossed className="h-8 w-8" />
            </div>
          )}
        </div>

        {/* Restaurant Name & Welcome */}
        <h1 className="mt-4 text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm text-inherit">
          {displayName}
        </h1>
        {description && (
          <p className="mt-1 text-xs sm:text-sm opacity-80 max-w-xs text-inherit">
            {description}
          </p>
        )}

        <div className="mt-4 inline-flex items-center rounded-2xl bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur dark:bg-zinc-900/80 border border-black/5 dark:border-white/10">
          <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
            {welcomeTitle}
          </span>
        </div>
      </header>

      {/* Main Interactive Actions Slot (F07/F08) */}
      <main className="my-6 w-full space-y-4">
        {children ? (
          children
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white/70 p-6 text-center backdrop-blur dark:border-white/10 dark:bg-zinc-900/70">
            <p className="text-sm font-medium opacity-90">
              {available
                ? "Selecione o serviço desejado nos botões abaixo."
                : "Atendimento temporariamente pausado nesta mesa."}
            </p>
          </div>
        )}
      </main>

      {/* Footer Info (Wi-Fi and Socials) */}
      <footer className="w-full space-y-4 pt-2">
        {/* Wi-Fi Card */}
        {wifiSsid && (
          <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/75 p-3.5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/75">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                <Wifi className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  Wi-Fi do Restaurante
                </p>
                <p className="truncate text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {wifiSsid}
                </p>
              </div>
            </div>

            {wifiPassword && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyWifi}
                className="h-8 border-zinc-200 bg-white/80 px-2.5 text-xs text-zinc-800 shadow-none hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label={
                  copiedWifi ? "Senha copiada" : "Copiar senha do Wi-Fi"
                }
              >
                {copiedWifi ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    <span>Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    <span>Copiar senha</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Social Media Links */}
        <div className="flex items-center justify-center gap-3">
          {Object.entries(socials).map(([key, val]) => {
            if (
              !val ||
              key.toLowerCase().includes("wifi") ||
              key.toLowerCase().includes("password") ||
              key.toLowerCase().includes("ssid")
            ) {
              return null;
            }

            const href = getSocialLink(key, val);
            if (!href) return null;

            const isInsta = key.toLowerCase().includes("instagram");
            const isWhats = key.toLowerCase().includes("whatsapp");

            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/70 text-zinc-700 shadow-sm transition-transform hover:scale-105 backdrop-blur dark:bg-zinc-900/70 dark:text-zinc-300 border border-black/5 dark:border-white/10"
                aria-label={`Acessar ${key}`}
              >
                {isInsta ? (
                  <InstagramIcon className="h-4 w-4" />
                ) : isWhats ? (
                  <Phone className="h-4 w-4" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
              </a>
            );
          })}
        </div>

        <p className="text-center text-[11px] opacity-60">
          TapMesa • Atendimento ágil via QR Code
        </p>
      </footer>
    </div>
  );
}
