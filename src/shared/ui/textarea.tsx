import * as React from "react";
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
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span
              className={cn(
                "text-xs font-mono",
                charCount >= maxLength
                  ? "text-red-600 dark:text-red-400 font-semibold"
                  : "text-zinc-400 dark:text-zinc-500",
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
            "flex min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white p-3 text-base sm:text-sm text-zinc-900 shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500",
            error &&
              "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500 dark:border-red-500",
            className,
          )}
          {...props}
        />
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

Textarea.displayName = "Textarea";
