import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      defaultValue,
      onChange,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const [charCount, setCharCount] = React.useState<number>(() => {
      if (typeof value === "string") return value.length;
      if (typeof defaultValue === "string") return defaultValue.length;
      return 0;
    });

    React.useEffect(() => {
      if (typeof value === "string") {
        setCharCount(value.length);
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full space-y-1.5 text-left">
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-ink"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span
              className={cn(
                "text-xs tabular-nums",
                charCount >= maxLength
                  ? "text-danger-ink font-semibold"
                  : "text-ink-2",
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          disabled={disabled}
          onChange={handleChange}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            "flex min-h-24 w-full rounded-control border border-border-control bg-surface p-3 text-base sm:text-sm text-ink transition-[border-color,box-shadow] duration-150 ease-out-soft placeholder:text-ink-placeholder hover:border-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-nav disabled:text-ink-3",
            error &&
              "border-danger hover:border-danger focus-visible:ring-danger",
            className,
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";
