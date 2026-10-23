"use client";

import * as React from "react";
import type { PrintViewTable } from "@/shared/types/api";

export interface TablePrintCardProps {
  table: PrintViewTable;
  restaurantName: string;
  logoUrl: string | null;
  primaryColor?: string;
  layoutSize?: "standard" | "large";
}

export function TablePrintCard({
  table,
  restaurantName,
  logoUrl,
  primaryColor = "#ea580c",
  layoutSize = "standard",
}: TablePrintCardProps) {
  // Converte a string SVG do QR Code em Data URI seguro (regra D8: sem dangerouslySetInnerHTML)
  const qrDataUri = React.useMemo(() => {
    if (!table.qrSvg) return null;
    return `data:image/svg+xml;utf8,${encodeURIComponent(table.qrSvg)}`;
  }, [table.qrSvg]);

  const isLarge = layoutSize === "large";

  return (
    <div
      className={`print-avoid-break relative flex flex-col justify-between items-center text-center bg-white border-2 border-dashed border-zinc-300 print:border-zinc-400 rounded-2xl print:rounded-xl p-5 print:p-4 text-zinc-900 transition-shadow ${
        isLarge
          ? "min-h-[340px] print:min-h-[300px]"
          : "min-h-[290px] print:min-h-[260px]"
      }`}
    >
      {/* Detalhe superior sutil na cor primária da marca (RNF-20 / RF-D06) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-16 rounded-b-full print:block"
        style={{ backgroundColor: primaryColor }}
      />

      {/* Cabeçalho do Cartão: Logo ou Nome do Restaurante */}
      <div className="w-full flex flex-col items-center pt-1">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={restaurantName}
            className="h-8 max-w-[140px] object-contain mb-1"
          />
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 print:text-zinc-600 line-clamp-1">
            {restaurantName}
          </span>
        )}

        {/* Destaque da Mesa */}
        <div className="mt-1 flex items-center justify-center gap-1.5">
          <span
            className="inline-flex items-center justify-center font-mono font-extrabold rounded-lg px-3 py-0.5 text-base print:text-sm border"
            style={{
              borderColor: `${primaryColor}40`,
              color: primaryColor,
              backgroundColor: `${primaryColor}10`,
            }}
          >
            MESA {String(table.number).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* QR Code Centralizado em Alto Contraste (preto sobre branco) */}
      <div className="my-2 flex flex-col items-center justify-center bg-white p-2 rounded-xl">
        {qrDataUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUri}
            alt={`QR Code para autoatendimento da Mesa ${table.number}`}
            className={`object-contain ${
              isLarge
                ? "w-44 h-44 print:w-40 print:h-40"
                : "w-36 h-36 print:w-32 print:h-32"
            }`}
          />
        ) : (
          <div className="w-32 h-32 flex items-center justify-center border border-zinc-200 text-xs text-zinc-400">
            QR Indisponível
          </div>
        )}
      </div>

      {/* Instrução ao Cliente e URL Curta */}
      <div className="w-full pb-0.5 space-y-0.5">
        <p className="text-xs print:text-[11px] font-bold text-zinc-900 print:text-black leading-tight">
          Aponte a câmera do seu celular
        </p>
        <p className="text-[11px] print:text-[10px] text-zinc-500 print:text-zinc-700 leading-tight">
          para chamar o garçom ou pedir a conta
        </p>
        <p className="pt-1 font-mono text-[9px] text-zinc-400 print:text-zinc-500 truncate">
          {table.url}
        </p>
      </div>
    </div>
  );
}
