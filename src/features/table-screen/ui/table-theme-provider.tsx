"use client";

import * as React from "react";
import { getAccessibleTextColor } from "../lib/contrast";
import type { PublicTableDto } from "@/shared/types/api";

interface TableThemeProviderProps {
  appearance?: PublicTableDto["appearance"];
  children: React.ReactNode;
}

export function TableThemeProvider({
  appearance,
  children,
}: TableThemeProviderProps) {
  const colors = appearance?.colors || {};
  const bgType = (appearance?.backgroundType || "color").toLowerCase();
  const backgroundValue = appearance?.backgroundValue || "";

  // Default color palette
  const rawBg =
    colors.background ||
    (backgroundValue.startsWith("#") ? backgroundValue : "#ffffff");

  const rawPrimary = colors.primary || "#ea580c";
  const rawText = colors.text || "#18181b";
  const rawPrimaryText = colors.primaryText || "#ffffff";

  // Contrast protection ensuring WCAG 2.1 AA (≥ 4.5:1)
  const safeText = getAccessibleTextColor(rawText, rawBg);
  const safePrimaryText = getAccessibleTextColor(rawPrimaryText, rawPrimary);

  const isImageBg =
    (bgType === "image" || bgType === "preset") && Boolean(backgroundValue);

  const styleVariables: React.CSSProperties = {
    "--table-bg": rawBg,
    "--table-primary": rawPrimary,
    "--table-text": safeText,
    "--table-primary-text": safePrimaryText,
  } as React.CSSProperties;

  return (
    <div
      style={styleVariables}
      className="relative min-h-[100dvh] w-full text-[var(--table-text)] transition-colors duration-200"
    >
      {/* Background Layer */}
      {isImageBg ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundValue})` }}
        >
          {/* Film / Overlay for contrast & legibility (RF-D08) */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
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
