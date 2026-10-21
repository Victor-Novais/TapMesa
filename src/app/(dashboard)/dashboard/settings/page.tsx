import * as React from "react";
import type { Metadata } from "next";
import { SettingsTabs } from "@/features/settings";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = {
  title: "Configurações",
  description:
    "Parâmetros de atendimento, aparência e notificações do restaurante",
};

export default function SettingsOverviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-12 w-96 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      }
    >
      <SettingsTabs />
    </React.Suspense>
  );
}
