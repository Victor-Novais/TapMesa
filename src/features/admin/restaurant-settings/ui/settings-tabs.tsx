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

export function SettingsTabs({ restaurantId }: { restaurantId: string }) {
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
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="-mx-4 overflow-x-auto border-b border-border px-4 pb-2 sm:mx-0 sm:px-0">
          <TabsList className="w-max bg-nav p-1">
            <TabsTrigger value="service" className="gap-2">
              <Clock className="hidden h-4 w-4 xs:block" aria-hidden />
              <span>Atendimento e SLA</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="hidden h-4 w-4 xs:block" aria-hidden />
              <span>Identidade visual</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="hidden h-4 w-4 xs:block" aria-hidden />
              <span>E-mails e alertas</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Aba 1: Atendimento (F16) */}
        <TabsContent value="service" className="pt-4">
          <ServiceSettingsForm restaurantId={restaurantId} />
        </TabsContent>

        {/* Aba 2: Aparência (F17) */}
        <TabsContent value="appearance" className="pt-4">
          <AppearanceSettingsForm restaurantId={restaurantId} />
        </TabsContent>

        {/* Aba 3: Notificações (F18) */}
        <TabsContent value="notifications" className="pt-4">
          <NotificationsSettingsForm restaurantId={restaurantId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
