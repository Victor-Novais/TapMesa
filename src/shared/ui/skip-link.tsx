import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface SkipLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
  label?: string;
}

/**
 * Link acessível para pular blocos repetidos de navegação (WCAG 2.1 AA - Critério 2.4.1 Bypass Blocks).
 * Permanece visualmente oculto até receber foco via teclado (Tab).
 */
export function SkipLink({
  targetId = "main-content",
  label = "Pular para o conteúdo principal",
  className,
  ...props
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]",
        "focus:inline-flex focus:items-center focus:rounded-control focus:bg-espresso focus:px-4 focus:py-2.5",
        "focus:text-sm focus:font-bold focus:text-on-espresso focus:shadow-elevation-2 focus:ring-2 focus:ring-focus-ring focus:ring-offset-2 focus:ring-offset-canvas",
        "dark:focus:bg-ink dark:focus:text-canvas",
        className,
      )}
      {...props}
    >
      {label}
    </a>
  );
}
