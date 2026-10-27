"use client";

import * as React from "react";
import {
  getAccessibleTextColor,
  getContrastRatio,
  isDarkBackground,
} from "../lib/contrast";
import type { PublicTableDto } from "@/shared/types/api";

interface TableThemeProviderProps {
  appearance?: PublicTableDto["appearance"];
  /**
   * true só na rota /m: aplica o tom do restaurante ao <html>, para que diálogos
   * (renderizados fora desta árvore) também o sigam. Na pré-visualização de
   * Aparência e na vitrine o tom fica restrito a este contêiner.
   */
  applyToDocument?: boolean;
  children: React.ReactNode;
}

// Padrões TapMesa usados só quando o restaurante não envia o campo (DESIGN_PLAN Q2)
const DEFAULT_BACKGROUND = "#F9F8F6";
const DEFAULT_PRIMARY = "#C4452D";
const DEFAULT_TEXT = "#141615";
const DEFAULT_PRIMARY_TEXT = "#FFFFFF";

export function TableThemeProvider({
  appearance,
  applyToDocument = false,
  children,
}: TableThemeProviderProps) {
  const colors: Record<string, string | undefined> = appearance?.colors ?? {};
  const bgType = appearance?.backgroundType ?? "color";
  const backgroundValue = appearance?.backgroundValue || "";

  const rawBg =
    colors.background ||
    (backgroundValue.startsWith("#") ? backgroundValue : DEFAULT_BACKGROUND);

  const rawPrimary = colors.primary || DEFAULT_PRIMARY;
  const rawText = colors.text || DEFAULT_TEXT;
  const rawPrimaryText = colors.primaryText || DEFAULT_PRIMARY_TEXT;

  // Contrast protection ensuring WCAG 2.1 AA (≥ 4.5:1)
  const safeText = getAccessibleTextColor(rawText, rawBg);
  const safePrimaryText = getAccessibleTextColor(rawPrimaryText, rawPrimary);

  const isImageBg = bgType === "image" && Boolean(backgroundValue);

  // Botão primário com menos de 3:1 contra o fundo ganha borda na cor do texto (Q3)
  const primaryBorder =
    getContrastRatio(rawPrimary, rawBg) < 3 ? safeText : rawPrimary;

  // Tom das superfícies da mesa: pelo fundo do restaurante, nunca pelo celular (Q4)
  const surfaceTone =
    isImageBg || isDarkBackground(rawBg) ? "table-dark" : "table-light";

  React.useEffect(() => {
    if (!applyToDocument) return;
    const root = document.documentElement;
    root.setAttribute("data-surface", surfaceTone);
    return () => root.removeAttribute("data-surface");
  }, [applyToDocument, surfaceTone]);

  const styleVariables: React.CSSProperties = {
    "--table-bg": rawBg,
    "--table-primary": rawPrimary,
    "--table-text": safeText,
    "--table-primary-text": safePrimaryText,
    "--table-primary-border": primaryBorder,
  } as React.CSSProperties;

  return (
    <div
      style={styleVariables}
      data-surface={surfaceTone}
      className="relative min-h-[100dvh] w-full text-[var(--table-text)] transition-colors duration-200"
    >
      {/* Background Layer */}
      {isImageBg ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          // Aspas e encodeURI: caracteres especiais na URL não quebram a regra CSS
          style={{ backgroundImage: `url("${encodeURI(backgroundValue)}")` }}
        >
          {/* Película escura para leitura sobre a foto (RF-D08), sem desfoque (Q6) */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0"
          style={{ backgroundColor: rawBg }}
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col">
        {children}
      </div>
    </div>
  );
}
