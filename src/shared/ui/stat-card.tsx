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
          <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {title}
          </p>
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {icon}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 font-mono">
            {value}
          </p>

          {goalStatus && goalLabel && (
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-semibold select-none",
                goalStatus === "met" &&
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
                goalStatus === "unmet" &&
                  "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
                goalStatus === "neutral" &&
                  "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
              )}
            >
              {goalLabel}
            </span>
          )}
        </div>

        {(variation || description) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {variation && (
              <span
                className={cn(
                  "inline-flex items-center font-medium font-mono",
                  isPositive && "text-emerald-600 dark:text-emerald-400",
                  isNegative && "text-red-600 dark:text-red-400",
                  !isPositive && !isNegative && "text-zinc-500",
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
