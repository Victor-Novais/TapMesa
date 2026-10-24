import * as React from "react";
import { AlertCircle } from "lucide-react";
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
            className="block text-sm font-medium text-ink"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="pointer-events-none absolute left-3 flex items-center text-ink-3">
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
              "flex h-11 w-full rounded-control border border-border-control bg-surface px-3.5 py-2 text-base sm:text-sm text-ink transition-[border-color,box-shadow] duration-150 ease-out-soft placeholder:text-ink-placeholder hover:border-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-nav disabled:text-ink-3",
              startAdornment && "pl-10",
              endAdornment && "pr-11",
              error &&
                "border-danger hover:border-danger focus-visible:ring-danger",
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
            className="flex items-start gap-1.5 text-xs font-medium text-danger-ink"
          >
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-ink-2">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
