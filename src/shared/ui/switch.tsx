"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/shared/lib/cn";

export interface SwitchProps extends React.ComponentPropsWithoutRef<
  typeof SwitchPrimitives.Root
> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, label, description, id, disabled, ...props }, ref) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;

  const content = (
    <SwitchPrimitives.Root
      id={switchId}
      ref={ref}
      disabled={disabled}
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-zinc-200 dark:data-[state=unchecked]:bg-zinc-800 before:absolute before:-inset-2.5 before:content-['']",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0 dark:bg-zinc-100",
        )}
      />
    </SwitchPrimitives.Root>
  );

  if (!label && !description) {
    return content;
  }

  return (
    <div className="flex items-center justify-between gap-3 text-left">
      <div className="space-y-0.5">
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer"
          >
            {label}
          </label>
        )}
        {description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {content}
    </div>
  );
});

Switch.displayName = SwitchPrimitives.Root.displayName;
