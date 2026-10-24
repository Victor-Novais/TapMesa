import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "alert" | "danger" | "info" | "primary";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  // Fundo tint + tinta da mesma família (contraste ≥ 4,5:1 nos dois temas)
  const variantStyles = {
    neutral: "bg-nav text-ink",
    success: "bg-success-tint text-success",
    alert: "bg-warning-tint text-warning-ink",
    danger: "bg-danger-tint text-danger-ink",
    info: "bg-surface text-ink-2 border-border",
    primary: "bg-brand-tint text-primary-ink",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded-chip",
    md: "px-2.5 py-1 text-xs sm:text-sm font-semibold rounded-chip",
  };

  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1 whitespace-nowrap border border-transparent transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
