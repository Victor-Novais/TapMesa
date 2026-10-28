"use client";

import * as React from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertOctagon,
  ArrowLeft,
  Building2,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import { parseApiError } from "@/shared/api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import type {
  AdminRestaurantItem,
  AdminRestaurantsResponse,
} from "@/shared/types/api";
import { useAppearanceQuery } from "../api/use-restaurant-settings-queries";
import { SettingsTabs } from "./settings-tabs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// O roteador não leva estado na navegação: o item vem da listagem já em cache
function useCachedRestaurantItem(
  restaurantId: string,
): AdminRestaurantItem | null {
  const queryClient = useQueryClient();
  const [item] = React.useState(() => {
    const pages = queryClient.getQueriesData<AdminRestaurantsResponse>({
      queryKey: ["admin", "restaurants"],
    });
    for (const [, page] of pages) {
      if (!Array.isArray(page?.data)) continue;
      const found = page.data.find((r) => r.id === restaurantId);
      if (found) return found;
    }
    return null;
  });
  return item;
}

export function RestaurantSettingsView({
  restaurantId,
}: {
  restaurantId: string;
}) {
  if (!UUID_REGEX.test(restaurantId)) {
    return <SettingsUnavailable reason="invalid" />;
  }

  // `key`: trocar de restaurante remonta a tela, sem estado de formulário do anterior
  return <RestaurantSettings key={restaurantId} restaurantId={restaurantId} />;
}

function RestaurantSettings({ restaurantId }: { restaurantId: string }) {
  const listItem = useCachedRestaurantItem(restaurantId);
  const { data: appearance, error } = useAppearanceQuery(restaurantId);

  if (error) {
    const problem = parseApiError(error);
    if (problem.status === 404)
      return <SettingsUnavailable reason="notFound" />;
    if (problem.status === 403)
      return <SettingsUnavailable reason="forbidden" />;
    if (problem.status === 400) return <SettingsUnavailable reason="invalid" />;
  }

  const name = listItem?.name ?? appearance?.name;

  return (
    // Sem a barra lateral do dashboard: a barra de alterações pendentes encosta na margem
    <div
      className="space-y-6"
      style={{ "--dashboard-sidebar-w": "0px" } as React.CSSProperties}
    >
      <div className="space-y-3">
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-control text-sm font-medium text-ink-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Restaurantes
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {name ? `Configurações — ${name}` : "Configurações"}
          </h1>
          {!name && <Skeleton className="h-6 w-40 rounded-control" />}
          {listItem?.status === "SUSPENDED" && (
            <Badge variant="danger" size="sm" className="gap-1.5">
              <AlertOctagon className="h-3 w-3" aria-hidden />
              SUSPENSO
            </Badge>
          )}
        </div>
        <p className="text-sm text-ink-2">
          Atendimento, identidade visual e e-mails deste restaurante. As
          alterações valem para o painel e a tela da mesa.
        </p>
      </div>

      <SettingsTabs restaurantId={restaurantId} />
    </div>
  );
}

const UNAVAILABLE = {
  invalid: {
    icon: <SearchX />,
    title: "Restaurante inválido",
    description:
      "O endereço não identifica um restaurante. Volte para a lista e escolha um.",
  },
  notFound: {
    icon: <Building2 />,
    title: "Restaurante não encontrado",
    description:
      "Ele pode ter sido excluído. Volte para a lista de restaurantes.",
  },
  forbidden: {
    icon: <ShieldAlert />,
    title: "Apenas administradores podem alterar configurações",
    description:
      "Sua sessão não tem permissão de administrador. Volte para o portal e tente novamente.",
  },
} as const;

function SettingsUnavailable({ reason }: { reason: keyof typeof UNAVAILABLE }) {
  const { icon, title, description } = UNAVAILABLE[reason];

  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar para restaurantes
          </Link>
        </Button>
      }
    />
  );
}
