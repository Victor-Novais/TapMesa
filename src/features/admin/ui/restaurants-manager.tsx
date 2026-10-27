"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth";
import { useAdminRestaurantsQuery } from "../api/use-admin-queries";
import {
  useSuspendAdminRestaurantMutation,
  useReactivateAdminRestaurantMutation,
  useResetAdminOwnerPasswordMutation,
  useImpersonateRestaurantMutation,
  useDeleteAdminRestaurantMutation,
} from "../api/use-admin-mutations";
import { CreateRestaurantDialog } from "./create-restaurant-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/data-table";
import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Skeleton } from "@/shared/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { Pagination } from "@/shared/ui/pagination";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { OneTimeSecretDialog } from "@/shared/ui/one-time-secret-dialog";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import {
  Building2,
  PlusCircle,
  Search,
  KeyRound,
  ExternalLink,
  Trash2,
  Lock,
  Unlock,
  MoreVertical,
  CheckCircle2,
  AlertOctagon,
} from "lucide-react";
import type {
  AdminRestaurantItem,
  CreateRestaurantResponse,
} from "@/shared/types/api";

export function RestaurantsManager() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { startImpersonation } = useAuthStore();

  // Pagination state
  const [cursorHistory, setCursorHistory] = React.useState<(string | null)[]>([
    null,
  ]);
  const [pageIndex, setPageIndex] = React.useState(0);
  const currentCursor = cursorHistory[pageIndex] ?? null;

  const { data, isLoading } = useAdminRestaurantsQuery(currentCursor, 20);

  // Mutations
  const suspendMutation = useSuspendAdminRestaurantMutation();
  const reactivateMutation = useReactivateAdminRestaurantMutation();
  const resetPasswordMutation = useResetAdminOwnerPasswordMutation();
  const impersonateMutation = useImpersonateRestaurantMutation();
  const deleteMutation = useDeleteAdminRestaurantMutation();

  // Local state
  const [search, setSearch] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [suspendTarget, setSuspendTarget] =
    React.useState<AdminRestaurantItem | null>(null);
  const [reactivateTarget, setReactivateTarget] =
    React.useState<AdminRestaurantItem | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] =
    React.useState<AdminRestaurantItem | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<AdminRestaurantItem | null>(null);
  const [oneTimeSecret, setOneTimeSecret] = React.useState<{
    username: string;
    secret: string;
    title?: string;
  } | null>(null);
  const [impersonatingId, setImpersonatingId] = React.useState<string | null>(
    null,
  );

  const restaurants = React.useMemo(() => data?.data ?? [], [data?.data]);

  // Filter restaurants by search query
  const filteredRestaurants = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.ownerUsername.toLowerCase().includes(q),
    );
  }, [restaurants, search]);

  // Handlers
  const handleNextPage = () => {
    const nextCursor = data?.nextCursor;
    if (nextCursor) {
      setCursorHistory((prev) => [...prev.slice(0, pageIndex + 1), nextCursor]);
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) {
      setPageIndex((prev) => prev - 1);
    }
  };

  const handleImpersonate = async (restaurant: AdminRestaurantItem) => {
    setImpersonatingId(restaurant.id);
    try {
      const res = await impersonateMutation.mutateAsync(restaurant.id);
      startImpersonation({
        accessToken: res.accessToken,
        restaurantId: res.restaurantId,
        restaurantName: restaurant.name,
        ownerUsername: res.ownerUsername,
      });
      queryClient.clear();
      router.push("/dashboard");
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.code === "RESTAURANT_SUSPENDED") {
        toast({
          title: "Restaurante suspenso",
          description:
            "Não é possível acessar o modo suporte em um estabelecimento suspenso. Reative o restaurante antes de impersonar.",
          type: "error",
        });
      } else {
        toast({
          title: "Erro ao acessar suporte",
          description:
            parsed.detail || "Não foi possível iniciar o modo suporte.",
          type: "error",
        });
      }
    } finally {
      setImpersonatingId(null);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendTarget) return;
    try {
      await suspendMutation.mutateAsync(suspendTarget.id);
      toast({
        title: "Restaurante suspenso",
        description: `O estabelecimento "${suspendTarget.name}" foi suspenso. O salão e acessos estão desativados.`,
        type: "success",
      });
      setSuspendTarget(null);
    } catch (err) {
      toast({
        title: "Erro ao suspender",
        description:
          parseApiError(err).detail ||
          "Não foi possível suspender o restaurante.",
        type: "error",
      });
    }
  };

  const handleConfirmReactivate = async () => {
    if (!reactivateTarget) return;
    try {
      await reactivateMutation.mutateAsync(reactivateTarget.id);
      toast({
        title: "Restaurante reativado",
        description: `O estabelecimento "${reactivateTarget.name}" voltou a operar normalmente.`,
        type: "success",
      });
      setReactivateTarget(null);
    } catch (err) {
      toast({
        title: "Erro ao reativar",
        description:
          parseApiError(err).detail ||
          "Não foi possível reativar o restaurante.",
        type: "error",
      });
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordTarget) return;
    try {
      const res = await resetPasswordMutation.mutateAsync(
        resetPasswordTarget.id,
      );
      const target = resetPasswordTarget;
      setResetPasswordTarget(null);
      setOneTimeSecret({
        username: target.ownerUsername,
        secret: res.newPasswordPlain,
        title: "Nova Senha do Administrador",
      });
    } catch (err) {
      toast({
        title: "Erro ao redefinir senha",
        description:
          parseApiError(err).detail || "Não foi possível gerar a nova senha.",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        confirmName: deleteTarget.name,
      });
      toast({
        title: "Restaurante excluído",
        description: `O estabelecimento "${deleteTarget.name}" foi removido definitivamente.`,
        type: "success",
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "Erro ao excluir restaurante",
        description:
          parseApiError(err).detail ||
          "Não foi possível excluir o restaurante.",
        type: "error",
      });
    }
  };

  const handleCreateSuccess = (res: CreateRestaurantResponse) => {
    toast({
      title: "Restaurante cadastrado",
      description: `O estabelecimento foi criado com sucesso.`,
      type: "success",
    });

    setOneTimeSecret({
      username: res.ownerUsername,
      secret: res.ownerPasswordPlain,
      title: "Credenciais de Acesso do Proprietário",
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
              Restaurantes Cadastrados
            </h1>
            {!isLoading && (
              <span className="rounded-full bg-nav px-2.5 py-0.5 text-xs font-bold text-ink">
                {restaurants.length} nesta página
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-2">
            Gestão global de clientes da plataforma, controle de status e acesso
            suporte (impersonação).
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Novo Restaurante</span>
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Buscar por nome ou dono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startAdornment={<Search className="h-4 w-4 text-ink-2" />}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Conteúdo: Tabela Desktop / Cards Mobile */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-card" />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7 text-ink-2" />}
          title="Nenhum restaurante cadastrado"
          description="Cadastre o primeiro estabelecimento para começar a disponibilizar a plataforma Aproxime Aí."
          action={
            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="gap-1.5"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Cadastrar Primeiro Restaurante</span>
            </Button>
          }
        />
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-card border border-dashed border-border p-8 text-center">
          <p className="text-sm font-medium text-ink-2">
            Nenhum restaurante encontrado com o termo &ldquo;{search}&rdquo;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearch("")}
            className="mt-3 text-xs"
          >
            Limpar busca
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Tabela Desktop / Tablet */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Estabelecimento</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px]">Cadastrado em</TableHead>
                  <TableHead className="w-[260px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => {
                  const isSuspended = restaurant.status === "SUSPENDED";
                  const isCurrentImpersonating =
                    impersonatingId === restaurant.id;

                  return (
                    <TableRow key={restaurant.id} className="group">
                      {/* Nome do Restaurante e Dono */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-nav text-ink-2">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-ink">
                              {restaurant.name}
                            </p>
                            <p className="text-xs text-ink-2">
                              Dono:{" "}
                              <span className="font-mono text-ink-2">
                                {restaurant.ownerUsername}
                              </span>
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {isSuspended ? (
                          <Badge variant="danger" size="sm" className="gap-1.5">
                            <AlertOctagon className="h-3 w-3" />
                            Suspenso
                          </Badge>
                        ) : (
                          <Badge
                            variant="success"
                            size="sm"
                            className="gap-1.5"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Ativo
                          </Badge>
                        )}
                      </TableCell>

                      {/* Data de Criação */}
                      <TableCell className="text-xs text-ink-2">
                        {formatDate(restaurant.createdAt)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Impersonar / Acessar Modo Suporte */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isSuspended || isCurrentImpersonating}
                                isLoading={isCurrentImpersonating}
                                onClick={() => handleImpersonate(restaurant)}
                                className="gap-1.5 text-xs font-semibold"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-primary-ink" />
                                <span>Suporte</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isSuspended
                                ? "Restaurantes suspensos não podem ser impersonados"
                                : "Acessar o dashboard do restaurante em modo suporte"}
                            </TooltipContent>
                          </Tooltip>

                          {/* Suspender / Reativar */}
                          {isSuspended ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setReactivateTarget(restaurant)
                                  }
                                  aria-label={`Reativar ${restaurant.name}`}
                                  className="text-success hover:bg-success-tint"
                                >
                                  <Unlock className="h-4 w-4" />
                                </IconButton>
                              </TooltipTrigger>
                              <TooltipContent>
                                Reativar restaurante
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <IconButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSuspendTarget(restaurant)}
                                  aria-label={`Suspender ${restaurant.name}`}
                                  className="text-warning-ink hover:bg-warning-tint"
                                >
                                  <Lock className="h-4 w-4" />
                                </IconButton>
                              </TooltipTrigger>
                              <TooltipContent>
                                Suspender restaurante
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Nova Senha do Dono */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setResetPasswordTarget(restaurant)
                                }
                                aria-label={`Gerar nova senha do dono de ${restaurant.name}`}
                              >
                                <KeyRound className="h-4 w-4 text-ink-2" />
                              </IconButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              Gerar nova senha para o proprietário
                            </TooltipContent>
                          </Tooltip>

                          {/* Excluir Restaurante */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(restaurant)}
                                aria-label={`Excluir ${restaurant.name}`}
                                className="text-ink-2 hover:bg-danger-tint hover:text-danger-ink"
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              Excluir restaurante definitivamente
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* 2. Cards no Mobile */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredRestaurants.map((restaurant) => {
              const isSuspended = restaurant.status === "SUSPENDED";
              const isCurrentImpersonating = impersonatingId === restaurant.id;

              return (
                <Card key={restaurant.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-nav text-ink-2">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-ink">
                          {restaurant.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          {isSuspended ? (
                            <Badge variant="danger" size="sm" className="gap-1">
                              <AlertOctagon className="h-3 w-3" />
                              Suspenso
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              size="sm"
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Ativo
                            </Badge>
                          )}
                          <span className="font-mono text-xs text-ink-2">
                            {restaurant.ownerUsername}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu de Opções no Mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <IconButton
                          variant="ghost"
                          size="sm"
                          aria-label={`Opções para ${restaurant.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </IconButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          disabled={isSuspended}
                          onClick={() => handleImpersonate(restaurant)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4 text-primary-ink" />
                          <span>Acessar Modo Suporte</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => setResetPasswordTarget(restaurant)}
                        >
                          <KeyRound className="mr-2 h-4 w-4 text-ink-2" />
                          <span>Nova Senha do Dono</span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() =>
                            isSuspended
                              ? setReactivateTarget(restaurant)
                              : setSuspendTarget(restaurant)
                          }
                        >
                          {isSuspended ? (
                            <>
                              <Unlock className="mr-2 h-4 w-4 text-success" />
                              <span>Reativar Restaurante</span>
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4 text-warning-ink" />
                              <span>Suspender Restaurante</span>
                            </>
                          )}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          variant="danger"
                          onClick={() => setDeleteTarget(restaurant)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir Restaurante</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-xs text-ink-2">
                    <span>
                      Cadastrado em {formatDate(restaurant.createdAt)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSuspended || isCurrentImpersonating}
                      isLoading={isCurrentImpersonating}
                      onClick={() => handleImpersonate(restaurant)}
                      className="h-8 gap-1.5 text-xs font-semibold"
                    >
                      <ExternalLink className="h-3 w-3 text-primary-ink" />
                      <span>Suporte</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Paginação */}
          {(pageIndex > 0 || Boolean(data?.nextCursor)) && (
            <Pagination
              page={pageIndex + 1}
              hasPreviousPage={pageIndex > 0}
              hasNextPage={Boolean(data?.nextCursor)}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          )}
        </div>
      )}

      {/* Diálogo de Criação de Restaurante */}
      <CreateRestaurantDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Confirmação de Suspensão */}
      <ConfirmDialog
        open={Boolean(suspendTarget)}
        onOpenChange={(open) => !open && setSuspendTarget(null)}
        title="Suspender Estabelecimento"
        description={`Tem certeza que deseja suspender o restaurante "${suspendTarget?.name}"? Ao suspender, todas as mesas ficarão inoperantes para os clientes e os funcionários perderão o acesso ao painel.`}
        confirmLabel="Suspender Estabelecimento"
        variant="danger"
        isLoading={suspendMutation.isPending}
        onConfirm={handleConfirmSuspend}
      />

      {/* Confirmação de Reativação */}
      <ConfirmDialog
        open={Boolean(reactivateTarget)}
        onOpenChange={(open) => !open && setReactivateTarget(null)}
        title="Reativar Estabelecimento"
        description={`Deseja reativar o restaurante "${reactivateTarget?.name}"? O estabelecimento voltará a operar no salão e os acessos da equipe serão restaurados imediatamente.`}
        confirmLabel="Reativar Estabelecimento"
        isLoading={reactivateMutation.isPending}
        onConfirm={handleConfirmReactivate}
      />

      {/* Confirmação de Reset de Senha do Dono */}
      <ConfirmDialog
        open={Boolean(resetPasswordTarget)}
        onOpenChange={(open) => !open && setResetPasswordTarget(null)}
        title="Redefinir Senha do Proprietário"
        description={`Deseja gerar uma nova senha temporária para o proprietário do restaurante "${resetPasswordTarget?.name}"? A senha antiga deixará de funcionar imediatamente.`}
        confirmLabel="Gerar Nova Senha"
        isLoading={resetPasswordMutation.isPending}
        onConfirm={handleConfirmResetPassword}
      />

      {/* Confirmação de Exclusão (Exige digitar o nome exato) */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Restaurante Permanentemente"
        description={`Esta ação é irreversível. O estabelecimento "${deleteTarget?.name}", todo o histórico de chamados, mesas e equipe serão apagados em definitivo do banco de dados.`}
        confirmMatchText={deleteTarget?.name}
        confirmLabel="Excluir Permanentemente"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {/* Exibição Única de Credenciais Temporárias */}
      {oneTimeSecret && (
        <OneTimeSecretDialog
          open={Boolean(oneTimeSecret)}
          onClose={() => setOneTimeSecret(null)}
          title={oneTimeSecret.title}
          username={oneTimeSecret.username}
          secret={oneTimeSecret.secret}
        />
      )}
    </div>
  );
}
