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
      <div className="flex min-h-dvh flex-col bg-canvas text-ink">
        {children}
      </div>
    </AuthGate>
  );
}
