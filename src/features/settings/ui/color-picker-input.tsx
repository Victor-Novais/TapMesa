"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface ColorPickerInputProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  helperText?: string;
  error?: string;
  id?: string;
  className?: string;
}

export function ColorPickerInput({
  label,
  value,
  onChange,
  helperText,
  error,
  id,
  className,
}: ColorPickerInputProps) {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const colorPickerId = `${inputId}-picker`;

  // Local state for typed hex input when user is actively editing
  const [localValue, setLocalValue] = React.useState<string | null>(null);

  const displayHex = localValue ?? value;

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (!val.startsWith("#") && val.length > 0) {
      val = `#${val}`;
    }
    setLocalValue(val);
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
      onChange(val);
      setLocalValue(null);
    }
  };

  const handleBlur = () => {
    setLocalValue(null);
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setLocalValue(null);
    onChange(hex);
  };

  return (
    <div className={cn("space-y-1.5 text-left", className)}>
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </label>

      <div className="flex items-center gap-2">
        {/* Color Swatch / Native Picker Trigger */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-300 shadow-sm dark:border-zinc-700 overflow-hidden cursor-pointer">
          <input
            id={colorPickerId}
            type="color"
            value={
              value.startsWith("#") && value.length === 7 ? value : "#000000"
            }
            onChange={handlePickerChange}
            className="absolute -inset-2 h-16 w-16 cursor-pointer opacity-0"
            aria-label={`Escolher ${label} visualmente`}
          />
          <div
            className="h-full w-full rounded-lg transition-transform hover:scale-105"
            style={{ backgroundColor: value }}
          />
        </div>

        {/* Hex Text Input */}
        <input
          id={inputId}
          type="text"
          value={displayHex}
          onChange={handleTextChange}
          onBlur={handleBlur}
          placeholder="#ea580c"
          maxLength={7}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error
              ? `${inputId}-error`
              : helperText
                ? `${inputId}-helper`
                : undefined
          }
          className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 font-mono text-sm text-zinc-900 shadow-sm transition-colors uppercase placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </div>

      {error ? (
        <p
          id={`${inputId}-error`}
          role="alert"
          aria-live="polite"
          className="text-xs font-medium text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : helperText ? (
        <p
          id={`${inputId}-helper`}
          className="text-xs text-zinc-500 dark:text-zinc-400"
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
