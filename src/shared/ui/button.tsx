import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "table";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variantStyles = {
      primary:
        "bg-orange-600 text-white shadow-sm hover:bg-orange-700 active:bg-orange-800 dark:bg-orange-600 dark:hover:bg-orange-500",
      secondary:
        "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700",
      outline:
        "border border-zinc-200 bg-transparent text-zinc-900 shadow-sm hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800",
      ghost:
        "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800",
      danger:
        "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500",
      success:
        "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500",
    };

    const sizeStyles = {
      sm: "h-9 min-h-[44px] sm:min-h-[36px] px-3 text-xs rounded-lg gap-1.5",
      md: "h-11 min-h-[44px] px-4 text-sm rounded-xl gap-2",
      lg: "h-12 min-h-[48px] px-6 text-base rounded-xl gap-2.5",
      table:
        "h-16 min-h-[64px] px-6 text-lg sm:text-xl font-bold rounded-2xl gap-3 shadow-md w-full",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      variant = "ghost",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const sizeStyles = {
      sm: "h-9 w-9 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] rounded-lg p-1.5",
      md: "h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl p-2",
      lg: "h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl p-2.5",
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        disabled={disabled || isLoading}
        isLoading={isLoading}
        className={cn(sizeStyles[size], "p-0", className)}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

IconButton.displayName = "IconButton";
