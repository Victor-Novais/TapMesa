import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "@/shared/lib/cn";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg" | "table";
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : "button";
    const baseStyles =
      "inline-flex items-center justify-center border border-transparent font-semibold transition-[transform,background-color,border-color,box-shadow,color] duration-150 ease-out-soft active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:shadow-none select-none";

    // Desabilitado em tom neutro legível (não opacidade), conforme DESIGN_PLAN §3
    const variantStyles = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-nav disabled:text-ink-3",
      secondary:
        "bg-nav text-ink hover:bg-border active:bg-border-subtle disabled:text-ink-3",
      outline:
        "border-border-control bg-surface text-ink hover:bg-nav active:bg-border-subtle disabled:border-border disabled:text-ink-3",
      ghost:
        "bg-transparent text-ink-2 hover:bg-nav hover:text-ink active:bg-border-subtle disabled:text-ink-3",
      danger:
        "bg-danger text-on-danger hover:bg-danger/90 active:bg-danger-ink disabled:bg-nav disabled:text-ink-3",
      success:
        "bg-success text-on-success hover:bg-success/90 active:bg-success/80 disabled:bg-nav disabled:text-ink-3",
    };

    // Alvo mínimo de 44px em todos os tamanhos; 64px nas ações da mesa
    const sizeStyles = {
      sm: "h-10 min-h-11 px-3 text-xs rounded-control gap-1.5",
      md: "h-11 min-h-11 px-4 text-sm rounded-control gap-2",
      lg: "h-12 min-h-12 px-6 text-base rounded-control gap-2.5",
      table:
        "h-16 min-h-16 px-6 text-lg sm:text-xl font-bold rounded-sheet gap-3 shadow-elevation-1 w-full",
    };

    return (
      <Component
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
        {isLoading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        )}
        <Slottable>{children}</Slottable>
      </Component>
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
      sm: "h-11 w-11 min-h-11 min-w-11 rounded-control",
      md: "h-11 w-11 min-h-11 min-w-11 rounded-control",
      lg: "h-12 w-12 min-h-12 min-w-12 rounded-control",
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
