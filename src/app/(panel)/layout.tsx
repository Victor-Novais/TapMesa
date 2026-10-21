"use client";

import * as React from "react";
import { AuthGate } from "@/features/auth";

export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate allowedRoles={["WAITER", "OWNER", "ADMIN"]}>
      <div className="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 flex flex-col">
        {children}
      </div>
    </AuthGate>
  );
}
