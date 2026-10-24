"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface CheckboxProps extends React.ComponentPropsWithoutRef<
  typeof CheckboxPrimitive.Root
> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, id, disabled, ...props }, ref) => {
  const generatedId = React.useId();
  const checkboxId = id || generatedId;

  const content = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={checkboxId}
      disabled={disabled}
      className={cn(
        "peer h-5 w-5 shrink-0 rounded-chip border border-border-control bg-surface transition-colors duration-150 ease-out-soft hover:border-ink-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:border-border disabled:bg-nav data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-on-primary",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (!label && !description) {
    return content;
  }

  return (
    <div className="flex items-start gap-2.5 text-left">
      <div className="pt-0.5">{content}</div>
      <div className="space-y-0.5">
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-medium text-ink cursor-pointer select-none"
          >
            {label}
          </label>
        )}
        {description && <p className="text-xs text-ink-2">{description}</p>}
      </div>
    </div>
  );
});

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
