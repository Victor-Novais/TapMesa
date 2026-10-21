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
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200",
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
        "fixed z-50 bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
        position === "right" &&
          "inset-y-0 right-0 h-full w-full max-w-md border-l animate-in slide-in-from-right duration-300",
        position === "left" &&
          "inset-y-0 left-0 h-full w-full max-w-xs border-r animate-in slide-in-from-left duration-300",
        position === "bottom" &&
          "inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl border-t animate-in slide-in-from-bottom duration-300",
        className,
      )}
      {...props}
    >
      {position === "bottom" && (
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-700" />
      )}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex-1" />
        <DialogPrimitive.Close className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl p-2 text-zinc-400 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-zinc-500 dark:hover:text-zinc-300">
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      </div>
      <div className="pt-4">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DrawerContent.displayName = "DrawerContent";
