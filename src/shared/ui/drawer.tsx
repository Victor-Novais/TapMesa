"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;

export const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-overlay data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-250 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200",
      className,
    )}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    position?: "bottom" | "right" | "left";
  }
>(({ className, children, position = "right", ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 overscroll-contain border-border bg-raised p-6 text-ink shadow-elevation-3",
        "data-[state=open]:animate-in data-[state=open]:duration-250 data-[state=open]:ease-out-soft data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=closed]:ease-in-soft",
        position === "right" &&
          "inset-y-0 right-0 h-full w-full max-w-md overflow-y-auto border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        position === "left" &&
          "inset-y-0 left-0 h-full w-full max-w-xs overflow-y-auto border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        position === "bottom" &&
          "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-sheet border-t pb-[calc(1.5rem+env(safe-area-inset-bottom))] data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        className,
      )}
      {...props}
    >
      {position === "bottom" && (
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
      )}
      <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
        <div className="flex-1" />
        <DialogPrimitive.Close className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 ease-out-soft hover:bg-nav hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-raised">
          <X className="h-5 w-5" aria-hidden />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </div>
      <div className="pt-4">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";
