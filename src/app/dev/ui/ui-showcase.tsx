"use client";

import * as React from "react";
import {
  Button,
  IconButton,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Checkbox,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Drawer,
  DrawerTrigger,
  DrawerContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Skeleton,
  EmptyState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  StatCard,
  ConnectionIndicator,
  ConfirmDialog,
  OneTimeSecretDialog,
  useTheme,
  ToastProvider,
  useToast,
} from "@/shared/ui";
import {
  TableScreen,
  TableThemeProvider,
  TableScreenSkeleton,
  TableScreenError,
  CallActions,
} from "@/features/table-screen";
import {
  PanelCallCard,
  RecentCallsDrawer,
  PanelStartDialog,
  PanelSettingsDialog,
  playWaiterSound,
  playBillSound,
  playUrgentSound,
  speakText,
  usePanelAudio,
  useWakeLock,
} from "@/features/panel";
import type {
  PanelCallDto,
  RecentAttendedCallDto,
  RestaurantAppearance,
} from "@/shared/types/api";
import { cn } from "@/shared/lib/cn";
import {
  Moon,
  Sun,
  Laptop,
  Bell,
  Utensils,
  Receipt,
  Users,
  AlertCircle,
  HelpCircle,
  Smartphone,
  Tablet,
  Monitor,
  Tv,
  Info,
} from "lucide-react";

export function UiShowcase() {
  const { theme, setTheme } = useTheme();
  const [viewportWidth, setViewportWidth] = React.useState<string>("100%");

  // Dialog States
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [secretOpen, setSecretOpen] = React.useState(false);
  const [secretValue, setSecretValue] = React.useState("TAP-9842-XKZ");

  const widths = [
    { label: "Fluido (100%)", value: "100%", icon: Monitor },
    { label: "320px (Compact)", value: "320px", icon: Smartphone },
    { label: "390px (Mobile)", value: "390px", icon: Smartphone },
    { label: "600px (Tablet Port.)", value: "600px", icon: Tablet },
    { label: "900px (Tablet Land.)", value: "900px", icon: Tablet },
    { label: "1280px (Desktop)", value: "1280px", icon: Monitor },
    { label: "1920px (Smart TV)", value: "1920px", icon: Tv },
  ];

  return (
    <ToastProvider>
      <TooltipProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
          {/* Top Control Bar */}
          <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-3">
            <div className="mx-auto flex flex-wrap items-center justify-between gap-4 max-w-7xl">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-orange-600 dark:text-orange-500">
                  TapMesa — Design System Showcase
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Vitrine viva de tokens, componentes base e validação de
                  responsividade
                </p>
              </div>

              {/* Viewport Width Selector */}
              <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                {widths.map((w) => {
                  const Icon = w.icon;
                  const active = viewportWidth === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => setViewportWidth(w.value)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                        active
                          ? "bg-white dark:bg-zinc-900 text-orange-600 dark:text-orange-400 shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{w.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`p-1.5 rounded-lg transition-all ${
                    theme === "light"
                      ? "bg-white dark:bg-zinc-900 text-orange-600 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                  aria-label="Tema Claro"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`p-1.5 rounded-lg transition-all ${
                    theme === "dark"
                      ? "bg-white dark:bg-zinc-900 text-orange-400 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-100"
                  }`}
                  aria-label="Tema Escuro"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  className={`p-1.5 rounded-lg transition-all ${
                    theme === "system"
                      ? "bg-white dark:bg-zinc-900 text-orange-500 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-100"
                  }`}
                  aria-label="Tema do Sistema"
                >
                  <Laptop className="h-4 w-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Main Showcase Canvas */}
          <main className="py-8 px-4 flex justify-center">
            <div
              style={{
                width: viewportWidth,
                maxWidth: "100%",
                transition: "width 0.25s ease-out",
              }}
              className="space-y-12 bg-white dark:bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm"
            >
              {/* Section: Tokens */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    1. Tokens de Cor & Semântica
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Cores semânticas com contraste AA verificado em claro e
                    escuro
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-orange-600 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">Primary</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      #ea580c
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-emerald-600 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">Success</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      #16a34a
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-amber-500 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">Alert</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      #eab308
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-red-600 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">
                      Danger/Urgent
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      #dc2626
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-blue-600 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">Info</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      #2563eb
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-zinc-100 dark:bg-zinc-800 mb-2 shadow-inner border border-zinc-200 dark:border-zinc-700" />
                    <span className="text-xs font-bold block">Surface</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      var(--surface)
                    </span>
                  </div>
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    <div className="h-10 w-full rounded-lg bg-zinc-900 dark:bg-zinc-100 mb-2 shadow-inner" />
                    <span className="text-xs font-bold block">Foreground</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      var(--foreground)
                    </span>
                  </div>
                </div>
              </section>

              {/* Section: Buttons */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    2. Botões & Alvos de Toque
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Alvos de 44px min para o app e 64px para a tela da mesa
                    (/m/[token])
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary (44px)</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="primary" isLoading>
                      Carregando
                    </Button>
                    <Button variant="primary" disabled>
                      Desabilitado
                    </Button>
                    <IconButton aria-label="Notificações" variant="outline">
                      <Bell className="h-4 w-4" />
                    </IconButton>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <IconButton
                          aria-label="Dica com Tooltip"
                          variant="ghost"
                        >
                          <Info className="h-4 w-4" />
                        </IconButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Atalho de ajuda operacional</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Mesa variant (64px) */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase">
                      Variante da Tela da Mesa (size=&quot;table&quot; - 64px de
                      altura)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button variant="primary" size="table">
                        <Utensils className="h-6 w-6" />
                        Chamar Garçom
                      </Button>
                      <Button variant="secondary" size="table">
                        <Receipt className="h-6 w-6" />
                        Pedir a Conta
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Formulários */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    3. Campos de Formulário & Controles
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Tamanho mínimo de 16px no mobile, estados de foco e erro
                    claros
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="Nome do Restaurante"
                    placeholder="Ex: Cantina do Nonno"
                    helperText="Nome exibido aos clientes no topo da tela da mesa."
                  />
                  <Input
                    label="E-mail de Notificações"
                    type="email"
                    placeholder="contato@restaurante.com"
                    error="Insira um endereço de e-mail válido."
                  />
                  <div className="space-y-1.5 text-left">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Fuso Horário Operacional
                    </label>
                    <Select defaultValue="sp">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o fuso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sp">
                          America/Sao_Paulo (UTC-3)
                        </SelectItem>
                        <SelectItem value="manaus">
                          America/Manaus (UTC-4)
                        </SelectItem>
                        <SelectItem value="noronha">
                          America/Noronha (UTC-2)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    label="Observação do Chamado"
                    placeholder="Ex: Trazer guardanapo extra, por favor."
                    maxLength={140}
                    showCount
                    defaultValue="Gostaria de gelo e limão para as bebidas."
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <Switch
                    label="Alerta Sonoro no Painel"
                    description="Tocar sino ao receber novos chamados"
                    defaultChecked
                  />
                  <Checkbox
                    label="Mostrar tempo de espera ao cliente"
                    description="Exibe cronômetro na tela da mesa"
                    defaultChecked
                  />
                </div>
              </section>

              {/* Section: Tabs Demo */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    4. Alternância de Abas (Tabs)
                  </h2>
                </div>

                <Tabs defaultValue="waiter">
                  <TabsList>
                    <TabsTrigger value="waiter">Garçom</TabsTrigger>
                    <TabsTrigger value="bill">Conta</TabsTrigger>
                    <TabsTrigger value="config">Configurações</TabsTrigger>
                  </TabsList>
                  <TabsContent value="waiter" className="pt-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Chamados de Garçom</CardTitle>
                        <CardDescription>
                          Fila de solicitações de auxílio e atendimento rápido
                          no salão.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                  <TabsContent value="bill" className="pt-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pedidos de Conta</CardTitle>
                        <CardDescription>
                          Clientes aguardando fechamento e conferência de
                          consumo.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                  <TabsContent value="config" className="pt-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Preferências da Fila</CardTitle>
                        <CardDescription>
                          Ajuste limites de tempo de alerta e urgência.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </TabsContent>
                </Tabs>
              </section>

              {/* Section: Badges & Conexão */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    5. Badges, Alertas & Indicadores de Conexão
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="neutral">Normal</Badge>
                  <Badge variant="success">Atendido</Badge>
                  <Badge variant="alert">Alerta (3:15)</Badge>
                  <Badge variant="danger">Urgente (5:42)</Badge>
                  <Badge variant="info">Mesa 12</Badge>
                  <Badge variant="primary">Conta Solicitada</Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <ConnectionIndicator status="connected" />
                  <ConnectionIndicator status="reconnecting" />
                  <ConnectionIndicator status="offline" />
                </div>
              </section>

              {/* Section: StatCards */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    6. Cartões de Estatísticas (StatCard)
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Adaptáveis via Container Queries do celular à Smart TV
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    title="Total de Chamados"
                    value={148}
                    variation={{ value: 12.4, label: "vs ontem" }}
                    icon={<Bell className="h-4 w-4" />}
                  />
                  <StatCard
                    title="Tempo Médio"
                    value="01:42"
                    variation={{ value: -8.1, label: "mais rápido" }}
                    goalStatus="met"
                    goalLabel="Dentro da meta"
                    icon={<Utensils className="h-4 w-4" />}
                  />
                  <StatCard
                    title="Chamados Críticos"
                    value={4}
                    variation={{ value: 33.3, label: "vs ontem" }}
                    goalStatus="unmet"
                    goalLabel="Fora da meta"
                    icon={<AlertCircle className="h-4 w-4" />}
                  />
                  <StatCard
                    title="Satisfação Média"
                    value="2.8 / 3.0"
                    description="89% avaliados"
                    goalStatus="met"
                    goalLabel="Excelente"
                    icon={<Users className="h-4 w-4" />}
                  />
                </div>
              </section>

              {/* Section: Diálogos e Modais */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    7. Diálogos, Gavetas & Segurança
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Bottom sheet no mobile, modal centralizado no desktop,
                    credenciais seguras
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Standard Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">Abrir Diálogo Base</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Informações da Mesa</DialogTitle>
                        <DialogDescription>
                          Visualize o QR Code e o link direto para acesso do
                          cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 text-sm text-zinc-600 dark:text-zinc-400">
                        Exemplo de conteúdo interno com rolagem segura.
                      </div>
                      <DialogFooter>
                        <Button variant="primary">Concluir</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Drawer */}
                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline">Abrir Gaveta Lateral</Button>
                    </DrawerTrigger>
                    <DrawerContent position="right">
                      <h3 className="text-lg font-bold">Chamados Recentes</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Histórico dos últimos 15 atendimentos concluídos.
                      </p>
                    </DrawerContent>
                  </Drawer>

                  {/* Confirm Dialog */}
                  <Button variant="danger" onClick={() => setConfirmOpen(true)}>
                    Abrir Confirmação Destrutiva
                  </Button>
                  <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    variant="danger"
                    title="Excluir Mesa 15?"
                    description="Esta ação desativará o QR Code imediatamente e removerá qualquer chamado ativo."
                    confirmLabel="Excluir mesa"
                    onConfirm={() => setConfirmOpen(false)}
                  />

                  {/* One Time Secret Dialog */}
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSecretValue(
                        `TMP-${Math.floor(100000 + Math.random() * 900000)}`,
                      );
                      setSecretOpen(true);
                    }}
                  >
                    Exibir OneTimeSecretDialog
                  </Button>
                  <OneTimeSecretDialog
                    open={secretOpen}
                    onClose={() => setSecretOpen(false)}
                    username="garcom_joao"
                    secret={secretValue}
                  />

                  {/* Toast Trigger */}
                  <ToastTriggerButton />
                </div>
              </section>

              {/* Section: Tabelas & Paginação */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    8. Tabelas de Dados & Paginação
                  </h2>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mesa</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Espera</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-bold">Mesa 03</TableCell>
                      <TableCell>Garçom</TableCell>
                      <TableCell className="font-mono">01:14</TableCell>
                      <TableCell>
                        <Badge variant="alert">Alerta</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Atender
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Mesa 08</TableCell>
                      <TableCell>Conta</TableCell>
                      <TableCell className="font-mono">00:45</TableCell>
                      <TableCell>
                        <Badge variant="neutral">Normal</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          Atender
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                <Pagination
                  page={1}
                  totalPages={5}
                  hasPreviousPage={false}
                  hasNextPage={true}
                />
              </section>

              {/* Section: Skeletons & Estado Vazio */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    9. Estados de Carregamento & Vazio (EmptyState)
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skeleton sample */}
                  <Card>
                    <CardHeader>
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>

                  {/* Empty State sample */}
                  <EmptyState
                    icon={<HelpCircle className="h-7 w-7" />}
                    title="Nenhum chamado ativo"
                    description="O salão está calmo no momento. Novos pedidos aparecerão aqui instantaneamente."
                    action={<Button variant="outline">Atualizar Fila</Button>}
                  />
                </div>
              </section>

              {/* Section: Tela da Mesa - Temas & Estados */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    10. Tela da Mesa (/m/[token]) — Temas & Estados (F06)
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Validação dos temas claro, escuro, com imagem de fundo, e
                    estados de erro/pausa com proteção de contraste WCAG 2.1 AA.
                  </p>
                </div>

                <TableScreenDemo />
              </section>

              {/* Section: Painel de Operação - Cards, TV 3m & Alertas */}
              <section className="space-y-4">
                <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    11. Painel de Operação (F10) — Cards, TV 3m & Alertas
                    Semânticos
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Validação visual para TV a 3 metros, tablet e mobile. Níveis
                    Normal, Alerta e Urgente (cor + ícone + texto), cronômetros
                    ao vivo, notas e gaveta de recentes.
                  </p>
                </div>

                <PanelScreenDemo />
              </section>
            </div>
          </main>
        </div>
      </TooltipProvider>
    </ToastProvider>
  );
}

function ToastTriggerButton() {
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast({
          title: "Chamado assumido com sucesso!",
          description: "Mesa 04 foi vinculada ao seu atendimento.",
          type: "success",
        })
      }
    >
      Disparar Notificação Toast
    </Button>
  );
}

function TableScreenDemo() {
  const [selectedTheme, setSelectedTheme] = React.useState<
    "light" | "dark" | "image" | "skeleton" | "not_found" | "paused"
  >("light");
  const [callScenario, setCallScenario] = React.useState<
    "idle" | "waiter" | "attended" | "confirmed" | "both"
  >("idle");
  const [baseTime] = React.useState(() => Date.now());

  const themes: Record<"light" | "dark" | "image", RestaurantAppearance> = {
    light: {
      name: "Trattoria Pasta & Vino",
      description: "Cozinha italiana artesanal e vinhos selecionados",
      logoUrl: null,
      backgroundType: "color",
      backgroundValue: "#ffffff",
      colors: {
        primary: "#ea580c",
        background: "#ffffff",
        surface: "#f4f4f5",
        text: "#18181b",
        primaryText: "#ffffff",
      },
      texts: {
        ...DEMO_TEXTS,
        welcomeTitle: "Bem-vindo à Mesa {tableNumber}",
        callWaiterButton: "Chamar Garçom",
        requestBillButton: "Pedir a Conta",
      },
      socials: {
        wifiName: "Trattoria_Clientes",
        wifiPassword: "vinhoebomdemais",
        instagram: "@trattoria_oficial",
        whatsapp: "11999998888",
      },
    },
    dark: {
      name: "Nocturne Cocktail Bar",
      description: "Mixologia autoral e jazz ambiente",
      logoUrl: null,
      backgroundType: "color",
      backgroundValue: "#121214",
      colors: {
        primary: "#f97316",
        background: "#121214",
        surface: "#1e1e22",
        text: "#f4f4f5",
        primaryText: "#18181b",
      },
      texts: {
        ...DEMO_TEXTS,
        welcomeTitle: "Mesa {tableNumber} • Lounge",
        callWaiterButton: "Chamar Garçom",
        requestBillButton: "Pedir a Conta",
      },
      socials: {
        wifiName: "Nocturne_5G",
        wifiPassword: "cocktailjazz2026",
        instagram: "@nocturnebar",
      },
    },
    image: {
      name: "Boi Bravo Steakhouse",
      description: "Cortes nobres na brasa desde 1998",
      logoUrl: null,
      backgroundType: "image",
      backgroundValue:
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600&auto=format&fit=crop",
      colors: {
        primary: "#dc2626",
        background: "#0f0f0f",
        surface: "#1c1c1c",
        text: "#ffffff",
        primaryText: "#ffffff",
      },
      texts: {
        ...DEMO_TEXTS,
        welcomeTitle: "Mesa {tableNumber} • Boi Bravo",
        callWaiterButton: "Chamar Garçom",
        requestBillButton: "Pedir a Conta",
      },
      socials: {
        wifiName: "BoiBravo_Guest",
        wifiPassword: "picanhanabrasa",
        instagram: "@boibravosteak",
      },
    },
  };

  const mockCalls = React.useMemo(() => {
    const nowIso = new Date(baseTime).toISOString();
    const tenMinAgo = new Date(baseTime - 145000).toISOString();
    const twoMinAgo = new Date(baseTime - 48000).toISOString();

    const waiterCall = {
      id: "demo-waiter-1",
      type: "WAITER" as const,
      status: "PENDING" as const,
      note: "Trazer gelo e copos extras",
      createdAt: tenMinAgo,
      attendedAt: null,
      rating: null,
      reopenCount: 1,
      serverNow: nowIso,
    };

    const billCall = {
      id: "demo-bill-1",
      type: "BILL" as const,
      status: "PENDING" as const,
      note: "Dividir em duas vias no cartão",
      createdAt: twoMinAgo,
      attendedAt: null,
      rating: null,
      reopenCount: 0,
      serverNow: nowIso,
    };

    const attendedCall = {
      id: "demo-attended-1",
      type: "WAITER" as const,
      status: "ATTENDED" as const,
      note: "Trazer gelo e copos extras",
      createdAt: tenMinAgo,
      attendedAt: twoMinAgo,
      confirmationDeadline: new Date(baseTime + 135000).toISOString(),
      rating: null,
      reopenCount: 0,
      contested: false,
      serverNow: nowIso,
    };

    const confirmedCall = {
      id: "demo-confirmed-1",
      type: "WAITER" as const,
      status: "CONFIRMED" as const,
      note: null,
      createdAt: tenMinAgo,
      attendedAt: twoMinAgo,
      rating: 3,
      reopenCount: 0,
      serverNow: nowIso,
    };

    if (callScenario === "waiter") return [waiterCall];
    if (callScenario === "attended") return [attendedCall];
    if (callScenario === "confirmed") return [confirmedCall];
    if (callScenario === "both") return [attendedCall, billCall];
    return [];
  }, [callScenario, baseTime]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={selectedTheme === "light" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("light")}
          >
            1. Claro
          </Button>
          <Button
            size="sm"
            variant={selectedTheme === "dark" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("dark")}
          >
            2. Escuro
          </Button>
          <Button
            size="sm"
            variant={selectedTheme === "image" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("image")}
          >
            3. Imagem
          </Button>
          <Button
            size="sm"
            variant={selectedTheme === "skeleton" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("skeleton")}
          >
            4. Esqueleto
          </Button>
          <Button
            size="sm"
            variant={selectedTheme === "paused" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("paused")}
          >
            5. Pausada
          </Button>
          <Button
            size="sm"
            variant={selectedTheme === "not_found" ? "primary" : "outline"}
            onClick={() => setSelectedTheme("not_found")}
          >
            6. 404
          </Button>
        </div>

        {/* Call scenario selector */}
        {selectedTheme !== "skeleton" &&
          selectedTheme !== "paused" &&
          selectedTheme !== "not_found" && (
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="px-2 text-[11px] font-semibold text-zinc-500 uppercase">
                Chamados:
              </span>
              <button
                type="button"
                onClick={() => setCallScenario("idle")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  callScenario === "idle"
                    ? "bg-white shadow text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Livre
              </button>
              <button
                type="button"
                onClick={() => setCallScenario("waiter")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  callScenario === "waiter"
                    ? "bg-white shadow text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Garçom
              </button>
              <button
                type="button"
                onClick={() => setCallScenario("attended")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  callScenario === "attended"
                    ? "bg-white shadow text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Atendido
              </button>
              <button
                type="button"
                onClick={() => setCallScenario("confirmed")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  callScenario === "confirmed"
                    ? "bg-white shadow text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Confirmado
              </button>
              <button
                type="button"
                onClick={() => setCallScenario("both")}
                className={cn(
                  "px-2 py-1 text-xs font-medium rounded-lg transition-colors",
                  callScenario === "both"
                    ? "bg-white shadow text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                )}
              >
                Ambos
              </button>
            </div>
          )}
      </div>

      <div className="relative mx-auto max-w-sm overflow-hidden rounded-3xl border border-zinc-300 shadow-xl dark:border-zinc-700">
        {selectedTheme === "skeleton" ? (
          <TableScreenSkeleton />
        ) : selectedTheme === "paused" ? (
          <TableScreenError type="PAUSED" />
        ) : selectedTheme === "not_found" ? (
          <TableScreenError type="NOT_FOUND" />
        ) : (
          <TableThemeProvider appearance={themes[selectedTheme]}>
            <TableScreen
              tableNumber={7}
              appearance={themes[selectedTheme]}
              available={true}
            >
              <CallActions
                token="demo-token"
                calls={mockCalls}
                available={true}
                showWaitTimeToCustomer={true}
                texts={themes[selectedTheme].texts}
              />
            </TableScreen>
          </TableThemeProvider>
        )}
      </div>
    </div>
  );
}

const DEMO_BASE_TIME = 1792584000000; // Deterministic static timestamp
const DEMO_SERVER_NOW = "2026-10-21T09:30:00.000Z";

const DEMO_TEXTS = {
  welcomeTitle: "Bem-vindo!",
  callWaiterButton: "Chamar Garçom",
  requestBillButton: "Pedir a Conta",
  notePlaceholder: "Observação opcional (ex.: trazer gelo)",
  pendingMessage: "Seu chamado foi enviado. Aguarde o atendimento.",
  attendedPrompt: "Você foi atendido?",
  confirmButton: "Sim, fui atendido",
  contestButton: "Ainda não",
  cancelButton: "Cancelar chamado",
};

// Completa os campos que a vitrine não precisa variar, no formato real da API
function demoPanelCall(
  call: Pick<
    PanelCallDto,
    | "id"
    | "tableNumber"
    | "type"
    | "note"
    | "createdAt"
    | "acknowledgedAt"
    | "acknowledgedById"
    | "reopenCount"
  >,
): PanelCallDto {
  return {
    restaurantId: "demo-restaurant",
    tableId: `demo-table-${call.tableNumber}`,
    status: "PENDING",
    originalCreatedAt: call.createdAt,
    firstAttendedAt: null,
    reopened: call.reopenCount > 0,
    contested: false,
    reactionTimeSec: null,
    serverNow: DEMO_SERVER_NOW,
    ...call,
  };
}

function demoRecent(
  call: Pick<
    RecentAttendedCallDto,
    "id" | "tableNumber" | "type" | "rating" | "executionTimeSec" | "attendedAt"
  > & { confirmationStatus: RecentAttendedCallDto["confirmationStatus"] },
): RecentAttendedCallDto {
  const status =
    call.confirmationStatus === "AWAITING_CONFIRMATION"
      ? "ATTENDED"
      : call.confirmationStatus === "CONTESTED"
        ? "PENDING"
        : call.confirmationStatus;
  return {
    restaurantId: "demo-restaurant",
    tableId: `demo-table-${call.tableNumber}`,
    status,
    note: null,
    createdAt: call.attendedAt,
    originalCreatedAt: call.attendedAt,
    acknowledgedAt: null,
    acknowledgedById: null,
    firstAttendedAt: call.attendedAt,
    confirmedAt: null,
    closedAt: null,
    attendedById: "my-user-uuid",
    reopenCount: 0,
    reopened: false,
    contested: false,
    reactionTimeSec: null,
    responseTimeSec: null,
    resolutionTimeSec: null,
    serverNow: DEMO_SERVER_NOW,
    ...call,
  };
}

const INITIAL_DEMO_CALLS: PanelCallDto[] = [
  demoPanelCall({
    id: "demo-call-1",
    tableNumber: 4,
    type: "WAITER",
    note: null,
    createdAt: new Date(DEMO_BASE_TIME - 85 * 1000).toISOString(),
    acknowledgedAt: null,
    acknowledgedById: null,
    reopenCount: 0,
  }),
  demoPanelCall({
    id: "demo-call-2",
    tableNumber: 12,
    type: "BILL",
    note: "Trazer maquininha de cartão e nota fiscal",
    createdAt: new Date(DEMO_BASE_TIME - 210 * 1000).toISOString(),
    acknowledgedAt: null,
    acknowledgedById: null,
    reopenCount: 0,
  }),
  demoPanelCall({
    id: "demo-call-3",
    tableNumber: 2,
    type: "WAITER",
    note: "Cliente com pressa",
    createdAt: new Date(DEMO_BASE_TIME - 360 * 1000).toISOString(),
    acknowledgedAt: null,
    acknowledgedById: null,
    reopenCount: 2,
  }),
  demoPanelCall({
    id: "demo-call-4",
    tableNumber: 8,
    type: "WAITER",
    note: null,
    createdAt: new Date(DEMO_BASE_TIME - 130 * 1000).toISOString(),
    acknowledgedAt: new Date(DEMO_BASE_TIME - 40 * 1000).toISOString(),
    acknowledgedById: "other-waiter-uuid",
    reopenCount: 0,
  }),
  demoPanelCall({
    id: "demo-call-5",
    tableNumber: 15,
    type: "BILL",
    note: null,
    createdAt: new Date(DEMO_BASE_TIME - 65 * 1000).toISOString(),
    acknowledgedAt: new Date(DEMO_BASE_TIME - 20 * 1000).toISOString(),
    acknowledgedById: "my-user-uuid",
    reopenCount: 0,
  }),
];

const INITIAL_DEMO_RECENTS: RecentAttendedCallDto[] = [
  demoRecent({
    id: "recent-1",
    tableNumber: 5,
    type: "WAITER",
    confirmationStatus: "CONFIRMED",
    rating: 3,
    executionTimeSec: 120,
    attendedAt: new Date(DEMO_BASE_TIME - 5 * 60 * 1000).toISOString(),
  }),
  demoRecent({
    id: "recent-2",
    tableNumber: 11,
    type: "BILL",
    confirmationStatus: "CLOSED_UNCONFIRMED",
    rating: null,
    executionTimeSec: 180,
    attendedAt: new Date(DEMO_BASE_TIME - 12 * 60 * 1000).toISOString(),
  }),
  demoRecent({
    id: "recent-3",
    tableNumber: 3,
    type: "WAITER",
    confirmationStatus: "AWAITING_CONFIRMATION",
    rating: null,
    executionTimeSec: 90,
    attendedAt: new Date(DEMO_BASE_TIME - 1 * 60 * 1000).toISOString(),
  }),
];

function PanelScreenDemo() {
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [startDialogOpen, setStartDialogOpen] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [mockFullscreen, setMockFullscreen] = React.useState(false);
  const [submittingId, setSubmittingId] = React.useState<string | null>(null);

  const audio = usePanelAudio(false);
  const wakeLock = useWakeLock(false);

  const [calls, setCalls] = React.useState<PanelCallDto[]>(INITIAL_DEMO_CALLS);
  const [recentCalls, setRecentCalls] =
    React.useState<RecentAttendedCallDto[]>(INITIAL_DEMO_RECENTS);

  const thresholds = {
    alertSec: 180,
    urgentSec: 300,
  };

  const handleAssume = (id: string) => {
    setSubmittingId(id);
    setTimeout(() => {
      setCalls((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                acknowledgedAt: "2026-10-21T09:30:00.000Z",
                acknowledgedById: "my-user-uuid",
              }
            : c,
        ),
      );
      setSubmittingId(null);
      toast({
        title: "Chamado assumido!",
        description: "Você assumiu o atendimento da mesa.",
        type: "success",
      });
    }, 400);
  };

  const handleAttend = (id: string) => {
    setSubmittingId(id);
    const target = calls.find((c) => c.id === id);
    setTimeout(() => {
      setCalls((prev) => prev.filter((c) => c.id !== id));
      if (target) {
        setRecentCalls((prev) => [
          demoRecent({
            id: `attended-${target.id}`,
            tableNumber: target.tableNumber,
            type: target.type,
            confirmationStatus: "AWAITING_CONFIRMATION",
            rating: null,
            executionTimeSec: 110,
            attendedAt: "2026-10-21T09:30:00.000Z",
          }),
          ...prev,
        ]);
      }
      setSubmittingId(null);
      toast({
        title: "Atendimento concluído!",
        description: `Mesa ${target?.tableNumber || ""} atendida com sucesso.`,
        type: "success",
      });
    }, 400);
  };

  const handleReset = () => {
    setCalls(INITIAL_DEMO_CALLS);
    setRecentCalls(INITIAL_DEMO_RECENTS);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            Fila ativa: {calls.length} chamados
          </span>
          <span className="text-xs text-zinc-400">•</span>
          <span className="text-xs text-zinc-500">
            Recentes: {recentCalls.length}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => playWaiterSound(80)}
            className="text-xs font-semibold h-8"
          >
            🔊 Som Garçom
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => playBillSound(80)}
            className="text-xs font-semibold h-8"
          >
            🔊 Som Conta
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => playUrgentSound(80)}
            className="text-xs font-semibold h-8 text-red-600"
          >
            🔥 Som Urgente
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => speakText("Mesa 7 chama o garçom com observação.")}
            className="text-xs font-semibold h-8"
          >
            🗣️ Voz pt-BR
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setStartDialogOpen(true)}
            className="text-xs font-semibold h-8"
          >
            📺 Modal Iniciar (F11)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setSettingsDialogOpen(true)}
            className="text-xs font-semibold h-8"
          >
            ⚙️ Ajustes (F11)
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setDrawerOpen(true)}
            className="text-xs font-semibold h-8"
          >
            Abrir Gaveta ({recentCalls.length})
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-8"
          >
            Resetar Cenário
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {calls.map((call) => (
          <PanelCallCard
            key={call.id}
            call={call}
            thresholds={thresholds}
            onAssume={handleAssume}
            onAttend={handleAttend}
            isSubmitting={submittingId === call.id}
            currentUserId="my-user-uuid"
          />
        ))}
      </div>

      <RecentCallsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        recentCalls={recentCalls}
        onRefresh={() => {
          toast({
            title: "Lista atualizada",
            description: "Chamados recentes recarregados.",
            type: "info",
          });
        }}
      />

      <PanelStartDialog
        open={startDialogOpen}
        onStart={async () => {
          setStartDialogOpen(false);
          toast({
            title: "Painel iniciado!",
            description: "Áudio liberado e modo operação ativo.",
            type: "success",
          });
        }}
      />

      <PanelSettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        audio={audio}
        wakeLock={wakeLock}
        isFullscreen={mockFullscreen}
        onToggleFullscreen={async () => setMockFullscreen((p) => !p)}
      />
    </div>
  );
}
