import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-70 flex-col items-center justify-center rounded-card border border-dashed border-border p-8 text-center",
        className,
      )}
      {...props}
    >
      {icon && (
        <div
          aria-hidden
          className="mb-3 flex h-12 w-12 items-center justify-center text-ink-3 [&_svg]:h-8 [&_svg]:w-8"
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink text-balance">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-2 text-pretty">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
