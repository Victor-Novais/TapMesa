import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  variation?: {
    value: number; // e.g. +12.5 or -5.0
    label?: string; // e.g. "vs ontem"
  };
  goalStatus?: "met" | "unmet" | "neutral";
  goalLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  variation,
  goalStatus,
  goalLabel,
  icon,
  className,
}: StatCardProps) {
  const isPositive = variation && variation.value > 0;
  const isNegative = variation && variation.value < 0;

  return (
    <Card className={cn("@container overflow-hidden", className)}>
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium text-ink-2">{title}</p>
          {icon && (
            <div
              className="flex h-8 w-8 items-center justify-center text-ink-3 [&_svg]:text-current"
              aria-hidden
            >
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {value}
          </p>

          {goalStatus && goalLabel && (
            <span
              className={cn(
                "flex-none whitespace-nowrap rounded-chip px-2 py-0.5 text-xs font-semibold select-none",
                goalStatus === "met" && "bg-success-tint text-success",
                goalStatus === "unmet" && "bg-danger-tint text-danger-ink",
                goalStatus === "neutral" && "bg-nav text-ink",
              )}
            >
              {goalLabel}
            </span>
          )}
        </div>

        {(variation || description) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-2">
            {variation && (
              <span
                className={cn(
                  "inline-flex items-center font-medium tabular-nums",
                  isPositive && "text-success",
                  isNegative && "text-danger-ink",
                  !isPositive && !isNegative && "text-ink-2",
                )}
              >
                {isPositive ? (
                  <TrendingUp className="mr-0.5 h-3.5 w-3.5" />
                ) : isNegative ? (
                  <TrendingDown className="mr-0.5 h-3.5 w-3.5" />
                ) : (
                  <Minus className="mr-0.5 h-3.5 w-3.5" />
                )}
                {isPositive ? "+" : ""}
                {variation.value.toFixed(1)}%
              </span>
            )}
            {variation?.label && <span>{variation.label}</span>}
            {!variation && description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
