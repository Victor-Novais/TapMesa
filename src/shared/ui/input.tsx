import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      id,
      disabled,
      startAdornment,
      endAdornment,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="pointer-events-none absolute left-3 flex items-center text-zinc-400">
              {startAdornment}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            className={cn(
              "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-base sm:text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500",
              startAdornment && "pl-10",
              endAdornment && "pr-11",
              error &&
                "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500 dark:border-red-500",
              className,
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-2 flex items-center">
              {endAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-zinc-500 dark:text-zinc-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
