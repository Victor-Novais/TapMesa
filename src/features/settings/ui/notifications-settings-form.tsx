"use client";

import * as React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
  useSendDailySummaryTestMutation,
  useSendUrgentAlertTestMutation,
} from "../api/use-settings-queries";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Skeleton } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import {
  Mail,
  Send,
  AlertTriangle,
  RotateCcw,
  Check,
  Timer,
  Info,
  CalendarDays,
  ShieldAlert,
} from "lucide-react";

const notificationSettingsSchema = z
  .object({
    emailSummaryEnabled: z.boolean(),
    summaryEmailRecipient: z.string().optional(),
    urgentAlertEnabled: z.boolean(),
    urgentAlertRecipient: z.string().optional(),
    alertCooldownMinutes: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(1, "O intervalo mínimo é de 1 minuto")
      .max(120, "O intervalo máximo é de 120 minutos (2 horas)"),
  })
  .refine(
    (data) => {
      if (data.emailSummaryEnabled) {
        if (!data.summaryEmailRecipient || !data.summaryEmailRecipient.trim()) {
          return false;
        }
        return z.string().email().safeParse(data.summaryEmailRecipient.trim())
          .success;
      }
      return true;
    },
    {
      message: "Informe um endereço de e-mail válido para receber o resumo",
      path: ["summaryEmailRecipient"],
    },
  )
  .refine(
    (data) => {
      if (data.urgentAlertEnabled) {
        if (!data.urgentAlertRecipient || !data.urgentAlertRecipient.trim()) {
          return false;
        }
        return z.string().email().safeParse(data.urgentAlertRecipient.trim())
          .success;
      }
      return true;
    },
    {
      message: "Informe um endereço de e-mail válido para alertas de urgência",
      path: ["urgentAlertRecipient"],
    },
  );

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

export function NotificationsSettingsForm() {
  const { toast } = useToast();
  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useNotificationSettingsQuery();

  const updateMutation = useUpdateNotificationSettingsMutation();
  const testSummaryMutation = useSendDailySummaryTestMutation();
  const testAlertMutation = useSendUrgentAlertTestMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    values: settings
      ? {
          emailSummaryEnabled: settings.emailSummaryEnabled,
          summaryEmailRecipient: settings.summaryEmailRecipient || "",
          urgentAlertEnabled: settings.urgentAlertEnabled,
          urgentAlertRecipient: settings.urgentAlertRecipient || "",
          alertCooldownMinutes: settings.alertCooldownMinutes ?? 15,
        }
      : undefined,
  });

  const emailSummaryEnabled = useWatch({
    control,
    name: "emailSummaryEnabled",
  });
  const urgentAlertEnabled = useWatch({ control, name: "urgentAlertEnabled" });
  const summaryEmailRecipient = useWatch({
    control,
    name: "summaryEmailRecipient",
  });
  const urgentAlertRecipient = useWatch({
    control,
    name: "urgentAlertRecipient",
  });

  const onSubmit = async (formData: NotificationSettingsFormData) => {
    try {
      const payload = {
        emailSummaryEnabled: formData.emailSummaryEnabled,
        summaryEmailRecipient: formData.emailSummaryEnabled
          ? formData.summaryEmailRecipient?.trim() || undefined
          : undefined,
        urgentAlertEnabled: formData.urgentAlertEnabled,
        urgentAlertRecipient: formData.urgentAlertEnabled
          ? formData.urgentAlertRecipient?.trim() || undefined
          : undefined,
        alertCooldownMinutes: formData.alertCooldownMinutes,
      };

      const updated = await updateMutation.mutateAsync(payload);

      // Re-fetch to guarantee sync with real backend state (Step 3)
      await refetch();

      reset({
        emailSummaryEnabled: updated.emailSummaryEnabled,
        summaryEmailRecipient: updated.summaryEmailRecipient || "",
        urgentAlertEnabled: updated.urgentAlertEnabled,
        urgentAlertRecipient: updated.urgentAlertRecipient || "",
        alertCooldownMinutes: updated.alertCooldownMinutes ?? 15,
      });

      toast({
        title: "Preferências salvas",
        description:
          "As configurações de notificação foram salvas e confirmadas pelo servidor.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro ao salvar notificações",
        description:
          parseApiError(err).detail || "Verifique os dados e tente novamente.",
        type: "error",
      });
    }
  };

  const handleDiscard = () => {
    if (settings) {
      reset({
        emailSummaryEnabled: settings.emailSummaryEnabled,
        summaryEmailRecipient: settings.summaryEmailRecipient || "",
        urgentAlertEnabled: settings.urgentAlertEnabled,
        urgentAlertRecipient: settings.urgentAlertRecipient || "",
        alertCooldownMinutes: settings.alertCooldownMinutes ?? 15,
      });
      toast({
        title: "Alterações descartadas",
        description: "Os campos foram restaurados para os valores salvos.",
        type: "info",
      });
    }
  };

  const handleSendTestSummary = async () => {
    try {
      const res = await testSummaryMutation.mutateAsync();
      toast({
        title: "Teste de resumo registrado",
        description: `Teste registrado para ${res.recipient}. O envio real de e-mail ainda não está ativo.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro no envio de teste",
        description:
          parseApiError(err).detail ||
          "Não foi possível enviar o resumo de teste.",
        type: "error",
      });
    }
  };

  const handleSendTestAlert = async () => {
    try {
      const res = await testAlertMutation.mutateAsync();
      toast({
        title: "Teste de alerta registrado",
        description: `Teste registrado para ${res.recipient}. O envio real de e-mail ainda não está ativo.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro no envio do alerta",
        description:
          parseApiError(err).detail ||
          "Não foi possível enviar o alerta de teste.",
        type: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <Card className="p-8 text-center border-red-200 dark:border-red-900/40">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
          Não foi possível carregar as notificações
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Ocorreu uma falha ao consultar as preferências de e-mail do
          restaurante.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="mt-4"
        >
          Tentar Novamente
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* 1. Resumo Diário Operacional por E-mail */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Resumo Diário Operacional por E-mail
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Receba um consolidado automático com métricas de chamados, tempos
              de resposta e garçons de destaque.
            </p>
          </div>
        </div>

        {/* Chave de Ativação do Resumo */}
        <Controller
          control={control}
          name="emailSummaryEnabled"
          render={({ field }) => (
            <Switch
              id="emailSummaryEnabled"
              label="Ativar envio diário do resumo operacional"
              description="Enviado automaticamente ao término do dia operacional para o e-mail cadastrado."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        {/* Destinatário do Resumo */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <Input
                id="summaryEmailRecipient"
                type="email"
                label="E-mail de Destino do Resumo"
                placeholder="gerente@meurestaurante.com.br"
                disabled={!emailSummaryEnabled}
                helperText="O relatório será entregue neste endereço na virada de turno."
                error={errors.summaryEmailRecipient?.message}
                startAdornment={<Mail className="h-4 w-4 text-zinc-400" />}
                {...register("summaryEmailRecipient")}
              />
            </div>

            <div className="sm:col-span-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendTestSummary}
                isLoading={testSummaryMutation.isPending}
                disabled={
                  !emailSummaryEnabled ||
                  !summaryEmailRecipient ||
                  Boolean(errors.summaryEmailRecipient)
                }
                className="w-full h-11 gap-1.5 text-xs font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Enviar Teste Agora</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Alertas de Chamados Urgentes */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Alertas Imediatos de Chamados Urgentes
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Notifique gerentes ou supervisores quando uma mesa ultrapassar o
              tempo limite de espera.
            </p>
          </div>
        </div>

        {/* Chave de Ativação do Alerta */}
        <Controller
          control={control}
          name="urgentAlertEnabled"
          render={({ field }) => (
            <Switch
              id="urgentAlertEnabled"
              label="Ativar notificação por e-mail para chamados urgentes"
              description="Dispara um aviso instantâneo quando uma mesa atinge o nível crítico de urgência no salão."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        {/* Destinatário e Cooldown */}
        <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-8">
              <Input
                id="urgentAlertRecipient"
                type="email"
                label="E-mail de Destino do Alerta de Urgência"
                placeholder="supervisao@meurestaurante.com.br"
                disabled={!urgentAlertEnabled}
                helperText="Endereço que receberá o aviso imediato com o número da mesa e tempo de espera."
                error={errors.urgentAlertRecipient?.message}
                startAdornment={<Mail className="h-4 w-4 text-zinc-400" />}
                {...register("urgentAlertRecipient")}
              />
            </div>

            <div className="sm:col-span-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendTestAlert}
                isLoading={testAlertMutation.isPending}
                disabled={
                  !urgentAlertEnabled ||
                  !urgentAlertRecipient ||
                  Boolean(errors.urgentAlertRecipient)
                }
                className="w-full h-11 gap-1.5 text-xs font-semibold"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Testar Alerta</span>
              </Button>
            </div>
          </div>

          {/* Intervalo Mínimo (Cooldown) */}
          <div className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div className="space-y-2">
                <label
                  htmlFor="alertCooldownMinutes"
                  className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Intervalo Mínimo entre Alertas (Cooldown)
                </label>
                <Input
                  id="alertCooldownMinutes"
                  type="number"
                  min={1}
                  max={120}
                  disabled={!urgentAlertEnabled}
                  placeholder="15"
                  endAdornment={
                    <span className="text-xs font-semibold text-zinc-400">
                      min
                    </span>
                  }
                  helperText="Tempo mínimo de espera antes de enviar outro e-mail de urgência."
                  error={errors.alertCooldownMinutes?.message}
                  {...register("alertCooldownMinutes", {
                    valueAsNumber: true,
                  })}
                />
              </div>

              <div className="rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 leading-relaxed border border-zinc-200/80 dark:border-zinc-700/60 mt-1">
                <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                  <Timer className="h-3.5 w-3.5 text-orange-500" />
                  Por que configurar o cooldown?
                </p>
                Durante horários de pico, se várias mesas atingirem o estado de
                urgência em sequência, o intervalo evita o envio excessivo de
                notificações para a mesma caixa postal.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Nota Informativa de Auditoria do Servidor */}
      <div
        role="region"
        aria-label="Nota de auditoria de notificações"
        className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400"
      >
        <Info className="h-4 w-4 shrink-0 text-zinc-500 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-zinc-900 dark:text-zinc-200">
            Armazenamento de Preferências
          </p>
          <p className="leading-relaxed">
            As configurações de notificação são mantidas ativas pelo servidor da
            TapMesa. Após salvar, o formulário confirma imediatamente o estado
            real retornado pela API.
          </p>
        </div>
      </div>

      {/* 4. Barra de Ações Pendentes ao Modificar */}
      {isDirty && (
        <div
          role="region"
          aria-label="Barra de alterações pendentes de notificações"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 ease-out"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Você possui alterações pendentes de notificação
                </p>
                <p className="text-[11px] text-zinc-500">
                  Clique em Salvar para atualizar os canais de recebimento do
                  restaurante.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                disabled={updateMutation.isPending}
                className="gap-1.5"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Descartar</span>
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updateMutation.isPending}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Salvar Configurações</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Estado sem alterações */}
      {!isDirty && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <p className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Canais de notificação sincronizados e prontos para envio.
          </p>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled
            className="text-xs"
          >
            Nenhuma alteração
          </Button>
        </div>
      )}
    </form>
  );
}
