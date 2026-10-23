"use client";

import * as React from "react";
import Image from "next/image";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAppearanceQuery,
  useUpdateAppearanceMutation,
  useResetAppearanceMutation,
  useUploadLogoMutation,
  useUploadBackgroundMutation,
} from "../api/use-settings-queries";
import { getContrastRatio } from "@/features/table-screen";
import { ColorPickerInput } from "./color-picker-input";
import { LivePhonePreview } from "./live-phone-preview";
import { Card } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import {
  Palette,
  Upload,
  Check,
  RotateCcw,
  AlertTriangle,
  Smartphone,
  Eye,
  Edit3,
  Wifi,
  Type,
  ImageIcon,
} from "lucide-react";
import type { RestaurantAppearance } from "@/shared/types/api";

const BACKGROUND_PRESETS = [
  {
    id: "rustic-wood",
    name: "Madeira Rústica",
    url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "modern-bistro",
    name: "Bistrô Aconchegante",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "dark-marble",
    name: "Mármore & Bar",
    url: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "artisan-cafe",
    name: "Café Contemporâneo",
    url: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80",
  },
];

const DEFAULT_PRESET_URL = BACKGROUND_PRESETS[0]?.url || "";

// Presets são imagens externas salvas como backgroundType "image" (a API só aceita "color" | "image")
const isPresetUrl = (value: string | null | undefined) =>
  BACKGROUND_PRESETS.some((preset) => preset.url === value);

// Limite e formatos aceitos pelo back nos uploads de logo e fundo
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const appearanceFormSchema = z.object({
  name: z
    .string()
    .min(2, "O nome do restaurante deve ter ao menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  description: z
    .string()
    .max(255, "A descrição deve ter no máximo 255 caracteres")
    .optional(),
  backgroundType: z.enum(["color", "image"] as const),
  backgroundValue: z.string().nullable().optional(),
  colors: z.object({
    primary: z
      .string()
      .regex(HEX_REGEX, "Cor hexadecimal inválida (ex: #ea580c)"),
    secondary: z
      .string()
      .regex(HEX_REGEX, "Cor hexadecimal inválida (ex: #18181b)"),
    background: z
      .string()
      .regex(HEX_REGEX, "Cor hexadecimal inválida (ex: #fafafa)"),
    text: z.string().regex(HEX_REGEX, "Cor hexadecimal inválida (ex: #09090b)"),
  }),
  texts: z.object({
    welcomeTitle: z.string().max(100, "Máximo de 100 caracteres"),
    callWaiterButton: z.string().max(50, "Máximo de 50 caracteres"),
    requestBillButton: z.string().max(50, "Máximo de 50 caracteres"),
  }),
  socials: z.object({
    instagram: z.string().optional(),
    wifiName: z.string().max(50).optional(),
    wifiPassword: z.string().max(50).optional(),
  }),
});

type AppearanceFormData = z.infer<typeof appearanceFormSchema>;

function toFormValues(appearance: RestaurantAppearance): AppearanceFormData {
  return {
    name: appearance.name || "",
    description: appearance.description || "",
    backgroundType: appearance.backgroundType,
    backgroundValue: appearance.backgroundValue || "",
    colors: {
      primary: appearance.colors.primary || "#ea580c",
      secondary: appearance.colors.secondary || "#18181b",
      background: appearance.colors.background || "#fafafa",
      text: appearance.colors.text || "#09090b",
    },
    texts: {
      welcomeTitle: appearance.texts.welcomeTitle || "",
      callWaiterButton: appearance.texts.callWaiterButton || "",
      requestBillButton: appearance.texts.requestBillButton || "",
    },
    socials: {
      instagram: appearance.socials.instagram || "",
      wifiName: appearance.socials.wifiName || "",
      wifiPassword: appearance.socials.wifiPassword || "",
    },
  };
}

// String vazia remove o link no back (o PUT substitui o objeto `socials` inteiro)
function sanitizeSocialLink(val: string | undefined): string {
  if (!val) return "";
  const clean = val.trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }
  // "@perfil" ou "perfil" (sem domínio): o back recusa "https://perfil"
  if (clean.startsWith("@") || !clean.includes(".")) {
    return `https://instagram.com/${clean.replace("@", "")}`;
  }
  return `https://${clean}`;
}

export function AppearanceSettingsForm() {
  const { data: appearance, isLoading, isError } = useAppearanceQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !appearance) {
    return (
      <Card className="p-8 text-center border-red-200 dark:border-red-900/40">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
        <h3 className="mt-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
          Não foi possível carregar as configurações de aparência
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Ocorreu um erro ao buscar os dados visuais. Por favor, tente
          recarregar.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Recarregar
        </Button>
      </Card>
    );
  }

  // O formulário só é montado com os dados carregados: assim os campos nunca
  // renderizam sem valor (o `values` do useForm só é aplicado após um efeito)
  return <AppearanceSettingsEditor appearance={appearance} />;
}

function AppearanceSettingsEditor({
  appearance,
}: {
  appearance: RestaurantAppearance;
}) {
  const { toast } = useToast();

  const updateMutation = useUpdateAppearanceMutation();
  const resetMutation = useResetAppearanceMutation();
  const uploadLogoMutation = useUploadLogoMutation();
  const uploadBackgroundMutation = useUploadBackgroundMutation();

  const [mobileTab, setMobileTab] = React.useState<"form" | "preview">("form");
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [localLogoPreview, setLocalLogoPreview] = React.useState<string | null>(
    null,
  );
  const [localBgPreview, setLocalBgPreview] = React.useState<string | null>(
    null,
  );

  const fileLogoRef = React.useRef<HTMLInputElement | null>(null);
  const fileBgRef = React.useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AppearanceFormData>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: toFormValues(appearance),
    values: toFormValues(appearance),
  });

  // Watch form values for real-time live preview
  const watchedName = useWatch({ control, name: "name" });
  const watchedDescription = useWatch({ control, name: "description" });
  const watchedBgType = useWatch({ control, name: "backgroundType" });
  const watchedBgValue = useWatch({ control, name: "backgroundValue" });
  const watchedColors = useWatch({ control, name: "colors" });
  const watchedTexts = useWatch({ control, name: "texts" });
  const watchedSocials = useWatch({ control, name: "socials" });

  // Calculate live contrast ratios (WCAG 2.1 AA)
  const textBgRatio =
    !watchedColors?.text || !watchedColors?.background
      ? 21
      : getContrastRatio(watchedColors.text, watchedColors.background);

  const buttonContrastRatio = !watchedColors?.primary
    ? 21
    : getContrastRatio("#ffffff", watchedColors.primary);

  // Construct dynamic live appearance object for the preview smartphone
  const currentLogo = localLogoPreview || appearance?.logoUrl || null;
  const currentBg =
    watchedBgType === "image" ? localBgPreview || watchedBgValue || null : null;

  // Modo do seletor de fundo: "preset" é uma imagem cuja URL é um dos presets
  const [bgModeOverride, setBgModeOverride] = React.useState<
    "preset" | "image" | null
  >(null);
  const bgMode =
    watchedBgType === "color"
      ? "color"
      : (bgModeOverride ?? (isPresetUrl(watchedBgValue) ? "preset" : "image"));

  // Campos vazios não são enviados: a tela do cliente usa o texto salvo/padrão do back
  const savedTexts = appearance?.texts;
  const liveAppearance: RestaurantAppearance = {
    name: watchedName || "Meu Restaurante",
    description: watchedDescription || null,
    logoUrl: currentLogo,
    backgroundType: watchedBgType || "color",
    backgroundValue: currentBg,
    colors: {
      primary: watchedColors?.primary || "#ea580c",
      secondary: watchedColors?.secondary || "#18181b",
      background: watchedColors?.background || "#fafafa",
      surface: appearance?.colors.surface || "#1e293b",
      text: watchedColors?.text || "#09090b",
    },
    texts: {
      ...(savedTexts ?? {
        welcomeTitle: "",
        callWaiterButton: "",
        requestBillButton: "",
        notePlaceholder: "",
        pendingMessage: "",
        attendedPrompt: "",
        confirmButton: "",
        contestButton: "",
        cancelButton: "",
      }),
      welcomeTitle:
        watchedTexts?.welcomeTitle?.trim() || savedTexts?.welcomeTitle || "",
      callWaiterButton:
        watchedTexts?.callWaiterButton?.trim() ||
        savedTexts?.callWaiterButton ||
        "",
      requestBillButton:
        watchedTexts?.requestBillButton?.trim() ||
        savedTexts?.requestBillButton ||
        "",
    },
    socials: {
      ...(appearance?.socials ?? {}),
      instagram: watchedSocials?.instagram || "",
      wifiName: watchedSocials?.wifiName || "",
      wifiPassword: watchedSocials?.wifiPassword || "",
    },
  };

  // Handle Logo Upload
  const handleLogoFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Envie apenas imagens nos formatos PNG, JPEG ou WebP.",
        type: "error",
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: "O logotipo deve ter no máximo 2 MB.",
        type: "error",
      });
      return;
    }

    // Instant local preview
    const tempUrl = URL.createObjectURL(file);
    setLocalLogoPreview(tempUrl);

    try {
      await uploadLogoMutation.mutateAsync(file);
      toast({
        title: "Logotipo atualizado",
        description: "O logotipo do restaurante foi carregado com sucesso.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro no envio do logotipo",
        description:
          parseApiError(err).detail || "Tente novamente em instantes.",
        type: "error",
      });
      setLocalLogoPreview(null);
    }
  };

  // Handle Background Image Upload
  const handleBgFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        title: "Formato inválido",
        description: "Envie apenas imagens nos formatos PNG, JPEG ou WebP.",
        type: "error",
      });
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem de fundo deve ter no máximo 2 MB.",
        type: "error",
      });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    setLocalBgPreview(tempUrl);
    setValue("backgroundType", "image", { shouldDirty: true });
    setValue("backgroundValue", tempUrl, { shouldDirty: true });

    try {
      const updated = await uploadBackgroundMutation.mutateAsync(file);
      setValue("backgroundValue", updated.backgroundValue, {
        shouldDirty: false,
      });
      toast({
        title: "Fundo atualizado",
        description: "A imagem de fundo foi enviada com sucesso.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro no envio da imagem de fundo",
        description:
          parseApiError(err).detail || "Tente novamente em instantes.",
        type: "error",
      });
      setLocalBgPreview(null);
    }
  };

  const onSubmit = async (data: AppearanceFormData) => {
    try {
      // O back recusa textos vazios: só enviamos os preenchidos
      const texts = Object.fromEntries(
        Object.entries(data.texts)
          .map(([key, value]): [string, string] => [key, value.trim()])
          .filter(([, value]) => value.length > 0),
      );
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        backgroundType: data.backgroundType,
        backgroundValue:
          data.backgroundType === "color" ? null : data.backgroundValue || null,
        colors: {
          primary: data.colors.primary,
          secondary: data.colors.secondary,
          background: data.colors.background,
          text: data.colors.text,
        },
        texts,
        // `socials` é substituído inteiro: preserva os links que o formulário não edita
        socials: {
          ...appearance?.socials,
          instagram: sanitizeSocialLink(data.socials.instagram),
          wifiName: data.socials.wifiName?.trim() || "",
          wifiPassword: data.socials.wifiPassword || "",
        },
      };

      await updateMutation.mutateAsync(payload);
      toast({
        title: "Aparência salva",
        description:
          "A identidade visual da tela da mesa foi atualizada com sucesso.",
        type: "success",
      });
      reset(data);
    } catch (err) {
      toast({
        title: "Erro ao salvar aparência",
        description:
          parseApiError(err).detail || "Verifique os campos e tente novamente.",
        type: "error",
      });
    }
  };

  const handleDiscard = () => {
    if (appearance) {
      reset(toFormValues(appearance));
      setBgModeOverride(null);
      setLocalLogoPreview(null);
      setLocalBgPreview(null);
      toast({
        title: "Alterações descartadas",
        description: "Os campos retornaram aos valores salvos.",
        type: "info",
      });
    }
  };

  const handleConfirmReset = async () => {
    try {
      const resetData = await resetMutation.mutateAsync();
      setLocalLogoPreview(null);
      setLocalBgPreview(null);
      setShowResetConfirm(false);
      setBgModeOverride(null);
      reset(toFormValues(resetData));
      toast({
        title: "Padrão restaurado",
        description:
          "As cores e textos voltaram para o padrão oficial do TapMesa.",
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro ao restaurar padrão",
        description:
          parseApiError(err).detail || "Não foi possível resetar a aparência.",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Botões de Ação Superiores: Restaurar Padrão */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Aparência da Tela da Mesa
          </h2>
          <p className="text-xs text-zinc-500">
            Personalize logotipo, cores da marca e mensagens que os clientes
            visualizam pelo QR Code.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowResetConfirm(true)}
          disabled={resetMutation.isPending}
          className="gap-1.5 text-xs text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restaurar Padrão</span>
        </Button>
      </div>

      {/* Alternância em Mobile: Formulário vs Pré-visualização */}
      <div className="flex lg:hidden items-center justify-center gap-2 p-1 bg-zinc-100 rounded-xl dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setMobileTab("form")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "form"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          <Edit3 className="h-4 w-4" />
          <span>Editar Aparência</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "preview"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          <Eye className="h-4 w-4" />
          <span>Pré-via ao Vivo</span>
        </button>
      </div>

      {/* Grid Principal: Formulário à Esquerda, Mockup à Direita (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUNA 1: Formulário de Configuração */}
        <div
          className={`lg:col-span-7 space-y-6 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* 1. Identidade e Logotipo */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Identidade do Estabelecimento
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Nome e logotipo exibidos no topo da tela do cliente.
                  </p>
                </div>
              </div>

              {/* Upload de Logotipo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
                  {liveAppearance.logoUrl ? (
                    <Image
                      src={liveAppearance.logoUrl}
                      alt="Logo do Restaurante"
                      width={64}
                      height={64}
                      className="h-full w-full object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="h-7 w-7 text-zinc-400" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Logotipo do Restaurante
                  </p>
                  <p className="text-xs text-zinc-500">
                    PNG, JPG ou WebP de até 2 MB. Proporção quadrada ou redonda
                    recomendada.
                  </p>
                </div>

                <input
                  ref={fileLogoRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileLogoRef.current?.click()}
                  isLoading={uploadLogoMutation.isPending}
                  className="gap-1.5 text-xs font-semibold shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Enviar Foto</span>
                </Button>
              </div>

              {/* Nome e Descrição */}
              <div className="space-y-4">
                <Input
                  id="name"
                  label="Nome de Exibição"
                  placeholder="ex: Bistrô do Carlos"
                  error={errors.name?.message}
                  {...register("name")}
                />

                <Input
                  id="description"
                  label="Subtítulo ou Descrição Curta (Opcional)"
                  placeholder="ex: Culinária artesanal contemporânea"
                  helperText="Exibido logo abaixo do nome do restaurante no cabeçalho da mesa."
                  error={errors.description?.message}
                  {...register("description")}
                />
              </div>
            </Card>

            {/* 2. Cores da Marca e Acessibilidade (WCAG AA) */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Paleta de Cores & Contraste
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Cores personalizadas com validação automática de contraste
                    WCAG AA.
                  </p>
                </div>
              </div>

              {/* Alertas de Contraste Insuficiente */}
              {textBgRatio < 4.5 && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Contraste de leitura reduzido ({textBgRatio.toFixed(1)}:1)
                    </p>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      A diretriz WCAG 2.1 AA recomenda no mínimo 4.5:1 entre a
                      cor do texto e a cor de fundo para garantir que pessoas
                      com dificuldades visuais ou em ambientes ensolarados
                      consigam ler o menu com facilidade.
                    </p>
                  </div>
                </div>
              )}

              {buttonContrastRatio < 3.0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Contraste baixo no botão principal (
                      {buttonContrastRatio.toFixed(1)}:1)
                    </p>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      O botão &ldquo;Chamar Garçom&rdquo; utiliza texto branco.
                      Cores muito claras como primária reduzem a legibilidade do
                      botão.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="colors.primary"
                  render={({ field }) => (
                    <ColorPickerInput
                      label="Cor Primária (Botões de Ação)"
                      value={field.value}
                      onChange={field.onChange}
                      helperText="Cor do botão 'Chamar Garçom' e destaques"
                      error={errors.colors?.primary?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="colors.secondary"
                  render={({ field }) => (
                    <ColorPickerInput
                      label="Cor Secundária (Botão da Conta)"
                      value={field.value}
                      onChange={field.onChange}
                      helperText="Cor do botão 'Pedir a Conta'"
                      error={errors.colors?.secondary?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="colors.background"
                  render={({ field }) => (
                    <ColorPickerInput
                      label="Cor de Fundo da Mesa"
                      value={field.value}
                      onChange={field.onChange}
                      helperText="Fundo geral quando o estilo sólido estiver ativo"
                      error={errors.colors?.background?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="colors.text"
                  render={({ field }) => (
                    <ColorPickerInput
                      label="Cor do Texto"
                      value={field.value}
                      onChange={field.onChange}
                      helperText="Tipografia de títulos, instruções e parágrafos"
                      error={errors.colors?.text?.message}
                    />
                  )}
                />
              </div>
            </Card>

            {/* 3. Estilo de Fundo do Salão */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Estilo de Fundo do Salão
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Escolha entre cor sólida, presets elegantes com textura ou
                    foto própria do ambiente.
                  </p>
                </div>
              </div>

              {/* Seletor de Tipo de Fundo */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setBgModeOverride(null);
                    setValue("backgroundType", "color", { shouldDirty: true });
                    setValue("backgroundValue", null, { shouldDirty: true });
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    bgMode === "color"
                      ? "border-orange-500 bg-orange-50/50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-200 ring-2 ring-orange-500/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <Palette className="h-5 w-5 mb-1.5 text-zinc-500" />
                  <span>Cor Sólida</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBgModeOverride("preset");
                    setValue("backgroundType", "image", { shouldDirty: true });
                    if (!isPresetUrl(watchedBgValue)) {
                      setValue("backgroundValue", DEFAULT_PRESET_URL, {
                        shouldDirty: true,
                      });
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    bgMode === "preset"
                      ? "border-orange-500 bg-orange-50/50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-200 ring-2 ring-orange-500/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <Smartphone className="h-5 w-5 mb-1.5 text-zinc-500" />
                  <span>Presets Prontos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBgModeOverride("image");
                    setValue("backgroundType", "image", { shouldDirty: true });
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all ${
                    bgMode === "image"
                      ? "border-orange-500 bg-orange-50/50 text-orange-950 dark:border-orange-500 dark:bg-orange-950/30 dark:text-orange-200 ring-2 ring-orange-500/20"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  <Upload className="h-5 w-5 mb-1.5 text-zinc-500" />
                  <span>Foto Própria</span>
                </button>
              </div>

              {/* Opções de Presets */}
              {bgMode === "preset" && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Selecione o Preset de Textura:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {BACKGROUND_PRESETS.map((preset) => {
                      const isSelected = watchedBgValue === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            setValue("backgroundValue", preset.url, {
                              shouldDirty: true,
                            })
                          }
                          className={`group relative flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                            isSelected
                              ? "border-orange-600 ring-2 ring-orange-500"
                              : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800"
                          }`}
                        >
                          <div className="relative h-20 w-full overflow-hidden bg-zinc-900">
                            <Image
                              src={preset.url}
                              alt={preset.name}
                              width={160}
                              height={80}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/40" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white shadow-sm">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <span className="p-2 text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload de Foto Própria */}
              {bgMode === "image" && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800">
                    <input
                      ref={fileBgRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleBgFileChange}
                      className="hidden"
                    />

                    <div className="space-y-1 flex-1 text-left">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Foto em Alta Resolução do Restaurante
                      </p>
                      <p className="text-xs text-zinc-500">
                        Uma película protetora translúcida (overlay) é aplicada
                        automaticamente sobre a foto para manter a legibilidade
                        dos botões e textos.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileBgRef.current?.click()}
                      isLoading={uploadBackgroundMutation.isPending}
                      className="gap-1.5 text-xs font-semibold shrink-0"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>Selecionar Imagem</span>
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* 4. Textos Personalizados */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Type className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Textos e Rótulos na Mesa
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Personalize o tom de voz e as chamadas para ação dos botões.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  id="welcomeTitle"
                  label="Título de Boas-vindas"
                  placeholder="Bem-vindo à Mesa {tableNumber}"
                  helperText="Use a tag {tableNumber} para que o número da mesa seja inserido automaticamente."
                  error={errors.texts?.welcomeTitle?.message}
                  {...register("texts.welcomeTitle")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="callWaiterButton"
                    label="Rótulo: Chamar Garçom"
                    placeholder="Chamar Garçom"
                    error={errors.texts?.callWaiterButton?.message}
                    {...register("texts.callWaiterButton")}
                  />

                  <Input
                    id="requestBillButton"
                    label="Rótulo: Pedir a Conta"
                    placeholder="Pedir a Conta"
                    error={errors.texts?.requestBillButton?.message}
                    {...register("texts.requestBillButton")}
                  />
                </div>
              </div>
            </Card>

            {/* 5. Redes Sociais e Wi-Fi (RF-D12) */}
            <Card className="p-6 space-y-6">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Wifi className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Wi-Fi e Redes Sociais
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Facilidades que aparecem no rodapé da mesa para os seus
                    clientes.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  id="instagram"
                  label="Perfil do Instagram"
                  placeholder="@meurestaurante ou instagram.com/meurestaurante"
                  helperText="Links recebem protocolo seguro automaticamente. O cliente acessa com um toque."
                  error={errors.socials?.instagram?.message}
                  {...register("socials.instagram")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="wifiName"
                    label="Nome da Rede Wi-Fi (SSID)"
                    placeholder="ex: Bistrô_Clientes_5G"
                    error={errors.socials?.wifiName?.message}
                    {...register("socials.wifiName")}
                  />

                  <Input
                    id="wifiPassword"
                    label="Senha do Wi-Fi"
                    placeholder="ex: bistro1234"
                    helperText="O cliente pode copiar a senha com um clique no celular."
                    error={errors.socials?.wifiPassword?.message}
                    {...register("socials.wifiPassword")}
                  />
                </div>
              </div>
            </Card>

            {/* Barra de Alterações Não Salvas (RN-06) */}
            {isDirty && (
              <div
                role="region"
                aria-label="Barra de alterações pendentes de aparência"
                className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95 animate-in fade-in-0 slide-in-from-bottom-4 duration-200 ease-out"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-pulse" />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Você possui alterações de aparência não salvas
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        As novidades só serão visualizadas pelos clientes na
                        mesa após clicar em Salvar.
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
          </form>
        </div>

        {/* COLUNA 2: Smartphone com Pré-via ao Vivo (Desktop Sticky / Mobile Tab) */}
        <div
          className={`lg:col-span-5 ${
            mobileTab === "form" ? "hidden lg:block" : "block"
          }`}
        >
          <div className="lg:sticky lg:top-24">
            <LivePhonePreview appearance={liveAppearance} tableNumber={4} />
          </div>
        </div>
      </div>

      {/* Diálogo de Confirmação para Restaurar Padrão */}
      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        title="Restaurar Padrão de Aparência"
        description="Tem certeza de que deseja redefinir todas as cores, textos e logotipo para os valores originais da TapMesa? Suas personalizações atuais serão substituídas."
        confirmLabel="Restaurar Padrão"
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={resetMutation.isPending}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
