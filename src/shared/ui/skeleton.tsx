import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Bloco no formato do conteúdo; pulso suave só sem prefers-reduced-motion
        "rounded-control bg-nav motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
