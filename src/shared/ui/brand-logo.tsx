import { cn } from "@/shared/lib/cn";

const LOGO_LIGHT = "/logo-light.svg";
const LOGO_DARK = "/Logo-dark.svg";

export interface BrandLogoProps {
  /** Lado do ícone em px (largura = altura, evita CLS). Legível a partir de 32px. */
  size?: number;
  /**
   * auto: segue o tema do app (só CSS, sem JS);
   * light / dark: versão para fundo claro ou escuro, independente do tema
   * (ex.: cabeçalho Deep Espresso, fundo do restaurante na mesa).
   */
  tone?: "auto" | "light" | "dark";
  /** "TapMesa" quando o logo é informativo; "" quando há texto ao lado. */
  alt?: string;
  priority?: boolean;
  className?: string;
}

// <img> simples: SVG estático não ganha nada com next/image e assim o logo não
// adiciona JS de cliente às rotas (o next/image somava 6–11 KB gzip).
export function BrandLogo({
  size = 36,
  tone = "auto",
  alt = "TapMesa",
  priority = false,
  className,
}: BrandLogoProps) {
  const base = cn("shrink-0 select-none", className);
  const image = (src: string, extra?: string) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      draggable={false}
      className={cn(base, extra)}
    />
  );

  if (tone === "light") return image(LOGO_LIGHT);
  if (tone === "dark") return image(LOGO_DARK);

  return (
    <>
      {image(LOGO_LIGHT, "dark:hidden")}
      {image(LOGO_DARK, "hidden dark:block")}
    </>
  );
}
