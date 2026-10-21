"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { ServiceSettingsForm } from "./service-settings-form";
import { AppearanceSettingsForm } from "./appearance-settings-form";
import { NotificationsSettingsForm } from "./notifications-settings-form";
import { Clock, Palette, Bell } from "lucide-react";

type SettingsTab = "service" | "appearance" | "notifications";

const VALID_TABS: SettingsTab[] = ["service", "appearance", "notifications"];

export function SettingsTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab = React.useMemo(() => {
    const param = searchParams.get("tab") as SettingsTab;
    return VALID_TABS.includes(param) ? param : "service";
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção de Configurações */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Configurações do Restaurante
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Ajuste limites de atendimento, identidade visual e notificações do seu
          estabelecimento.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-zinc-100 p-1 dark:bg-zinc-800/80">
            <TabsTrigger value="service" className="gap-2">
              <Clock className="h-4 w-4" />
              <span>Atendimento</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span>Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              <span>Notificações</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba 1: Atendimento (F16) */}
        <TabsContent value="service" className="pt-4">
          <ServiceSettingsForm />
        </TabsContent>

        {/* Aba 2: Aparência (F17) */}
        <TabsContent value="appearance" className="pt-4">
          <AppearanceSettingsForm />
        </TabsContent>

        {/* Aba 3: Notificações (F18) */}
        <TabsContent value="notifications" className="pt-4">
          <NotificationsSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
