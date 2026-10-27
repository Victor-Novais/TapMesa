"use client";

import * as React from "react";
import Image from "next/image";
import { Wifi, Copy, Check, Phone, Globe } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { isDarkBackground } from "../lib/contrast";
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
  // Logo que falhou ao carregar: cai no BrandLogo até o restaurante enviar outro
  const [failedLogoUrl, setFailedLogoUrl] = React.useState<string | null>(null);

  const { name, description, logoUrl, texts, socials } = appearance;
  const showLogo = Boolean(logoUrl) && logoUrl !== failedLogoUrl;

  const displayName = name || "Restaurante";

  // A versão do logo segue o fundo do restaurante (nunca o modo escuro do celular)
  const restaurantBg =
    appearance.colors?.background ||
    (appearance.backgroundValue?.startsWith("#")
      ? appearance.backgroundValue
      : "#F9F8F6");
  const hasImageBg =
    appearance.backgroundType === "image" &&
    Boolean(appearance.backgroundValue);
  const fallbackLogoTone =
    hasImageBg || isDarkBackground(restaurantBg) ? "dark" : "light";

  // Interpolate welcome title with table number: "Bem-vindo à Mesa {tableNumber}"
  const rawWelcome = texts.welcomeTitle || "Mesa {tableNumber}";
  const welcomeTitle = rawWelcome.replace(
    /\{tableNumber\}|\{mesa\}|\{number\}/gi,
    String(tableNumber),
  );

  const wifiSsid = socials.wifiName;
  const wifiPassword = socials.wifiPassword;

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
            className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink shadow-elevation-1"
          >
            Mesa {tableNumber}
          </Badge>
          <ConnectionIndicator status={connectionStatus} className="text-xs" />
        </div>

        {/* Logo or Restaurant Avatar */}
        <div className="mt-2 flex h-20 w-20 items-center justify-center overflow-hidden rounded-sheet bg-surface shadow-elevation-1">
          {showLogo && logoUrl ? (
            // Sem o otimizador: a API já entrega a imagem redimensionada e com
            // cache longo, e o Next 16 recusa otimizar imagens de localhost
            <Image
              src={logoUrl}
              alt={`Logotipo ${displayName}`}
              width={80}
              height={80}
              className="h-full w-full object-cover"
              priority
              unoptimized
              onError={() => setFailedLogoUrl(logoUrl)}
            />
          ) : (
            // Sem logo do restaurante: logo TapMesa na versão do fundo do restaurante
            <BrandLogo
              size={80}
              tone={fallbackLogoTone}
              alt=""
              priority
              className="h-full w-full"
            />
          )}
        </div>

        {/* Restaurant Name & Welcome */}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-balance text-inherit">
          {displayName}
        </h1>
        {description && (
          <p className="mt-1 max-w-xs text-sm text-pretty text-inherit">
            {description}
          </p>
        )}

        {/* Boas-vindas sem cartão próprio: evita "cartão dentro de cartão" */}
        <p className="mt-3 text-base font-semibold text-inherit">
          {welcomeTitle}
        </p>
      </header>

      {/* Main Interactive Actions Slot (F07/F08) */}
      <main
        id="main-content"
        tabIndex={-1}
        className="my-6 w-full space-y-4 focus:outline-none"
      >
        {children ? (
          children
        ) : (
          <div className="rounded-card border border-border bg-surface p-6 text-center text-ink">
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
          <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-3 text-ink">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-tint text-primary-ink">
                <Wifi className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs text-ink-2">Wi-Fi do Restaurante</p>
                <p className="truncate text-sm font-semibold text-ink">
                  {wifiSsid}
                </p>
              </div>
            </div>

            {wifiPassword && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyWifi}
                className="shrink-0 px-3"
                aria-label={
                  copiedWifi ? "Senha copiada" : "Copiar senha do Wi-Fi"
                }
              >
                {copiedWifi ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                    <span>Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
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
                className="flex h-11 w-11 items-center justify-center rounded-control border border-border bg-surface text-ink-2 transition-[color,transform] duration-150 ease-out-soft hover:text-ink active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                aria-label={`Acessar ${key}`}
              >
                {isInsta ? (
                  <InstagramIcon className="h-5 w-5" aria-hidden />
                ) : isWhats ? (
                  <Phone className="h-5 w-5" aria-hidden />
                ) : (
                  <Globe className="h-5 w-5" aria-hidden />
                )}
              </a>
            );
          })}
        </div>

        <p className="text-center text-xs text-inherit">
          TapMesa • Atendimento ágil via QR Code
        </p>
      </footer>
    </div>
  );
}
