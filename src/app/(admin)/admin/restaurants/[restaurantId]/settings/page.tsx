import * as React from "react";
import type { Metadata } from "next";
import { RestaurantSettingsView } from "@/features/admin";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = {
  title: "Configurações do restaurante",
  description:
    "Atendimento, identidade visual e e-mails de um restaurante no Aproxime Aí Admin",
};

export default async function AdminRestaurantSettingsPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;

  // As abas leem `?tab=` com useSearchParams, que pede um Suspense
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
      <RestaurantSettingsView restaurantId={restaurantId} />
    </React.Suspense>
  );
}
