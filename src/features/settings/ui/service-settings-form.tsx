"use client";

import * as React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useServiceSettingsQuery,
  useUpdateServiceSettingsMutation,
} from "../api/use-settings-queries";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { Skeleton } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import {
  AlertTriangle,
  Info,
  Check,
  RotateCcw,
  Sparkles,
  Timer,
  Globe2,
  CalendarDays,
  Eye,
} from "lucide-react";

const COMMON_TIMEZONES = [
  { value: "America/Sao_Paulo", label: "São Paulo / Brasília (UTC-3)" },
  { value: "America/Manaus", label: "Manaus / Amazonas (UTC-4)" },
  { value: "America/Cuiaba", label: "Cuiabá / MT (UTC-4)" },
  { value: "America/Campo_Grande", label: "Campo Grande / MS (UTC-4)" },
  { value: "America/Belem", label: "Belém / PA (UTC-3)" },
  { value: "America/Fortaleza", label: "Fortaleza / CE (UTC-3)" },
  { value: "America/Recife", label: "Recife / PE (UTC-3)" },
  { value: "America/Bahia", label: "Salvador / BA (UTC-3)" },
  { value: "America/Rio_Branco", label: "Rio Branco / AC (UTC-5)" },
  { value: "America/Boa_Vista", label: "Boa Vista / RR (UTC-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho / RO (UTC-4)" },
  { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
  { value: "UTC", label: "UTC (Tempo Universal Coordenado)" },
];

const CUTOFF_HOURS = [
  { value: 0, label: "00:00 (Meia-noite / Padrão)" },
  { value: 1, label: "01:00 da madrugada" },
  { value: 2, label: "02:00 da madrugada" },
  { value: 3, label: "03:00 da madrugada" },
  { value: 4, label: "04:00 da madrugada" },
  { value: 5, label: "05:00 da madrugada (Recomendado para bares/noturnos)" },
  { value: 6, label: "06:00 da manhã" },
  { value: 7, label: "07:00 da manhã" },
  { value: 8, label: "08:00 da manhã" },
  { value: 9, label: "09:00 da manhã" },
  { value: 10, label: "10:00 da manhã" },
  { value: 11, label: "11:00 da manhã" },
];

const serviceSettingsSchema = z
  .object({
    responseGoalSec: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(10, "A meta mínima deve ser de pelo menos 10 segundos")
      .max(3600, "A meta máxima deve ser de no máximo 3.600 segundos (1 hora)"),
    alertSec: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(10, "O tempo de alerta deve ser de pelo menos 10 segundos")
      .max(3600, "O tempo de alerta deve ser de no máximo 3.600 segundos"),
    urgentSec: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(10, "O tempo de urgência deve ser de pelo menos 10 segundos")
      .max(3600, "O tempo de urgência deve ser de no máximo 3.600 segundos"),
    confirmationWindowSec: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(30, "A janela de confirmação deve ter no mínimo 30 segundos")
      .max(
        900,
        "A janela de confirmação deve ter no máximo 900 segundos (15 minutos)",
      ),
    timezone: z.string().refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      { message: "Fuso horário IANA inválido (ex: America/Sao_Paulo)" },
    ),
    dayCutoffHour: z.coerce
      .number()
      .int("Deve ser um número inteiro")
      .min(0, "A hora de corte deve estar entre 0 e 11")
      .max(11, "A hora de corte deve estar entre 0 e 11"),
    showWaitTimeToCustomer: z.boolean(),
  })
  .refine((data) => data.alertSec < data.urgentSec, {
    message:
      "O tempo de alerta deve ser estritamente menor do que o tempo de urgência",
    path: ["alertSec"],
  });

type ServiceSettingsFormData = z.infer<typeof serviceSettingsSchema>;

function formatDurationPreview(seconds: number | undefined): string {
  if (seconds === undefined || isNaN(seconds) || seconds < 0) return "--";
  const mins = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  if (mins === 0) return `${remaining}s`;
  if (remaining === 0) return `${mins} min`;
  return `${mins} min ${remaining}s`;
}

export function ServiceSettingsForm() {
  const { toast } = useToast();
  const { data: settings, isLoading, isError } = useServiceSettingsQuery();
  const updateMutation = useUpdateServiceSettingsMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<ServiceSettingsFormData>({
    resolver: zodResolver(serviceSettingsSchema),
    values: settings
      ? {
          responseGoalSec: settings.responseGoalSec,
          alertSec: settings.alertSec,
          urgentSec: settings.urgentSec,
          confirmationWindowSec: settings.confirmationWindowSec,
          timezone: settings.timezone || "America/Sao_Paulo",
          dayCutoffHour: settings.dayCutoffHour ?? 0,
          showWaitTimeToCustomer: settings.showWaitTimeToCustomer ?? true,
        }
      : undefined,
  });

  const responseGoalSec = useWatch({ control, name: "responseGoalSec" });
  const alertSec = useWatch({ control, name: "alertSec" });
  const urgentSec = useWatch({ control, name: "urgentSec" });
  const confirmationWindowSec = useWatch({
    control,
    name: "confirmationWindowSec",
  });
  const dayCutoffHour = useWatch({ control, name: "dayCutoffHour" });

  const onSubmit = async (formData: ServiceSettingsFormData) => {
    try {
      await updateMutation.mutateAsync(formData);
      toast({
        title: "Configurações atualizadas",
        description:
          "Os parâmetros de atendimento foram salvos e passarão a vigorar nos painéis a partir do próximo carregamento.",
        type: "success",
      });
      reset(formData);
    } catch (err) {
      toast({
        title: "Erro ao salvar configurações",
        description:
          parseApiError(err).detail ||
          "Verifique os dados informados e tente novamente.",
        type: "error",
      });
    }
  };

  const handleDiscard = () => {
    if (settings) {
      reset({
        responseGoalSec: settings.responseGoalSec,
        alertSec: settings.alertSec,
        urgentSec: settings.urgentSec,
        confirmationWindowSec: settings.confirmationWindowSec,
        timezone: settings.timezone || "America/Sao_Paulo",
        dayCutoffHour: settings.dayCutoffHour ?? 0,
        showWaitTimeToCustomer: settings.showWaitTimeToCustomer ?? true,
      });
      toast({
        title: "Alterações descartadas",
        description: "Os campos foram restaurados para os valores salvos.",
        type: "info",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !settings) {
    return (
      <Card className="p-8 text-center border-red-200 dark:border-red-900/40">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
          Não foi possível carregar as configurações de atendimento
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Ocorreu uma falha ao obter os dados do restaurante. Por favor, tente
          novamente.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Recarregar Página
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
      {/* 1. Limites de Tempo e SLA */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Tempos de Resposta e Níveis de Urgência
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Defina os limites de tempo que regem as cores, alertas sonoros e
              prioridades nos painéis dos garçons.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Meta de Atendimento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="responseGoalSec"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Meta de Atendimento
              </label>
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {formatDurationPreview(responseGoalSec)}
              </span>
            </div>
            <Input
              id="responseGoalSec"
              type="number"
              min={10}
              max={3600}
              placeholder="120"
              endAdornment={
                <span className="text-xs font-semibold text-zinc-400">seg</span>
              }
              helperText="Tempo ideal desejado para que o garçom assuma ou atenda ao chamado."
              error={errors.responseGoalSec?.message}
              {...register("responseGoalSec", { valueAsNumber: true })}
            />
          </div>

          {/* Tempo para Alerta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="alertSec"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Tempo para Alerta
              </label>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 font-mono text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                {formatDurationPreview(alertSec)}
              </span>
            </div>
            <Input
              id="alertSec"
              type="number"
              min={10}
              max={3600}
              placeholder="180"
              endAdornment={
                <span className="text-xs font-semibold text-zinc-400">seg</span>
              }
              helperText="Chamado muda para amarelo (Atenção) no painel do salão."
              error={errors.alertSec?.message}
              {...register("alertSec", { valueAsNumber: true })}
            />
          </div>

          {/* Tempo para Urgência */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="urgentSec"
                className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              >
                Tempo para Urgência
              </label>
              <span className="rounded-md bg-red-100 px-2 py-0.5 font-mono text-xs font-bold text-red-800 dark:bg-red-950/60 dark:text-red-300">
                {formatDurationPreview(urgentSec)}
              </span>
            </div>
            <Input
              id="urgentSec"
              type="number"
              min={10}
              max={3600}
              placeholder="300"
              endAdornment={
                <span className="text-xs font-semibold text-zinc-400">seg</span>
              }
              helperText="Chamado atinge nível crítico, disparando alerta sonoro e visual pulsante."
              error={errors.urgentSec?.message}
              {...register("urgentSec", { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Janela de Confirmação e Avaliação */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="confirmationWindowSec"
                  className="text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Janela de Avaliação do Cliente
                </label>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-mono text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {formatDurationPreview(confirmationWindowSec)}
                </span>
              </div>
              <Input
                id="confirmationWindowSec"
                type="number"
                min={30}
                max={900}
                placeholder="120"
                endAdornment={
                  <span className="text-xs font-semibold text-zinc-400">
                    seg
                  </span>
                }
                helperText="Tempo concedido na tela da mesa para o cliente avaliar ou contestar o chamado (de 30s a 900s)."
                error={errors.confirmationWindowSec?.message}
                {...register("confirmationWindowSec", { valueAsNumber: true })}
              />
            </div>

            <div className="rounded-xl bg-zinc-50 p-3.5 text-xs text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400 leading-relaxed border border-zinc-200/80 dark:border-zinc-700/60 mt-1">
              <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-orange-500" />
                Como funciona a confirmação?
              </p>
              Assim que o garçom marca um chamado como atendido no painel, a
              tela da mesa do cliente exibe o cartão de avaliação com contagem
              regressiva deste limite. Se o garçom não tiver ido à mesa, o
              cliente pode clicar em &ldquo;Não fui atendido&rdquo; para reabrir
              o chamado imediatamente.
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Operação, Fuso e Dia Operacional */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Fuso Horário e Dia Operacional
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Configure as regras de virada de turno para bares e restaurantes
              que operam de madrugada.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fuso Horário IANA */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="timezone"
              className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Fuso Horário Oficial (IANA)
            </label>
            <select
              id="timezone"
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              {...register("timezone")}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.value})
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {errors.timezone.message}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Garante a precisão dos relatórios de horário de pico e gráficos
              operacionais.
            </p>
          </div>

          {/* Hora de Corte do Dia Operacional */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="dayCutoffHour"
              className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100"
            >
              Hora de Corte do Dia Operacional
            </label>
            <select
              id="dayCutoffHour"
              className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
              {...register("dayCutoffHour", { valueAsNumber: true })}
            >
              {CUTOFF_HOURS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
            {errors.dayCutoffHour && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {errors.dayCutoffHour.message}
              </p>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Horário em que o faturamento e os atendimentos viram para a data
              do dia seguinte.
            </p>
          </div>
        </div>

        {/* Exemplo Prático do Dia Operacional */}
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
          <CalendarDays className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-950 dark:text-blue-100">
              Exemplo Prático com Corte às{" "}
              {String(dayCutoffHour ?? 0).padStart(2, "0")}:00:
            </p>
            <p className="leading-relaxed">
              {(dayCutoffHour ?? 0) === 0 ? (
                <>
                  Com corte às 00:00 (padrão), qualquer chamado registrado após
                  a meia-noite é contabilizado no dia civil que se inicia.
                </>
              ) : (
                <>
                  Um atendimento registrado às{" "}
                  <strong>02:30 da madrugada</strong> de sábado será agrupado e
                  consolidado no relatório do movimento de{" "}
                  <strong>sexta-feira à noite</strong>. O novo dia operacional
                  só terá início a partir das{" "}
                  <strong>{String(dayCutoffHour).padStart(2, "0")}:00</strong>{" "}
                  da manhã.
                </>
              )}
            </p>
          </div>
        </div>
      </Card>

      {/* 3. Experiência do Cliente na Mesa */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Transparência na Tela da Mesa
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Controle o que os clientes podem visualizar no celular enquanto
              aguardam atendimento.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Controller
            control={control}
            name="showWaitTimeToCustomer"
            render={({ field }) => (
              <Switch
                id="showWaitTimeToCustomer"
                label="Exibir Cronômetro de Espera para o Cliente"
                description="Quando ativado, os clientes acompanham no smartphone os minutos e segundos decorridos desde o envio da chamada."
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </Card>

      {/* 4. Barra Fixa / Flutuante de Ações ao Modificar */}
      {isDirty && (
        <div
          role="region"
          aria-label="Barra de alterações pendentes"
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 transition-all animate-in slide-in-from-bottom-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Você possui alterações pendentes
                </p>
                <p className="text-[11px] text-zinc-500">
                  Os novos limites passarão a valer no painel operacional após o
                  próximo carregamento.
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
                <span>Salvar Alterações</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Botões Normais no Rodapé se não estiver flutuando */}
      {!isDirty && (
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <p className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-zinc-400" />
            Configurações salvas e sincronizadas com os servidores da TapMesa.
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
