"use client";

import * as React from "react";
import { useAuthStore } from "@/features/auth";
import {
  useTeamUsersQuery,
  useAttendantMetricsQuery,
} from "../api/use-team-queries";
import {
  useUpdateTeamUserStatusMutation,
  useResetTeamUserPasswordMutation,
  useDeleteTeamUserMutation,
} from "../api/use-team-mutations";
import { TeamMembersList } from "./team-members-list";
import { AttendantMetricsView } from "./attendant-metrics-view";
import { CreateTeamUserDialog } from "./create-team-user-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { OneTimeSecretDialog } from "@/shared/ui/one-time-secret-dialog";
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import { Users, UserPlus, Search, BarChart3, RefreshCw } from "lucide-react";
import type { TeamUser, CreateTeamUserResponse } from "@/shared/types/api";

export function TeamManager() {
  const { toast } = useToast();
  const currentUser = useAuthStore((s) => s.user);

  // Queries
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isRefetching: isRefetchingUsers,
    refetch: refetchUsers,
  } = useTeamUsersQuery();

  const { data: metricsData, isLoading: isLoadingMetrics } =
    useAttendantMetricsQuery();

  // Mutations
  const updateStatusMutation = useUpdateTeamUserStatusMutation();
  const resetPasswordMutation = useResetTeamUserPasswordMutation();
  const deleteUserMutation = useDeleteTeamUserMutation();

  // State
  const [activeTab, setActiveTab] = React.useState<"members" | "metrics">(
    "members",
  );
  const [search, setSearch] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [togglingUserId, setTogglingUserId] = React.useState<string | null>(
    null,
  );
  const [resetTarget, setResetTarget] = React.useState<TeamUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TeamUser | null>(null);
  const [oneTimeSecret, setOneTimeSecret] = React.useState<{
    username: string;
    secret: string;
  } | null>(null);

  // Filtered users
  const filteredUsers = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        (u.role === "OWNER" ? "gerente dono" : "garçom").includes(q),
    );
  }, [users, search]);

  // Handlers
  const handleToggleStatus = async (user: TeamUser) => {
    setTogglingUserId(user.id);
    try {
      await updateStatusMutation.mutateAsync({
        id: user.id,
        data: { active: !user.active },
      });
      toast({
        title: user.active ? "Acesso bloqueado" : "Acesso liberado",
        description: user.active
          ? `O usuário ${user.username} foi bloqueado e não poderá mais efetuar login.`
          : `O acesso de ${user.username} foi ativado com sucesso.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro ao atualizar status",
        description:
          parseApiError(err).detail || "Tente novamente em instantes.",
        type: "error",
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const res = await resetPasswordMutation.mutateAsync(resetTarget.id);
      const targetUser = resetTarget;
      setResetTarget(null);
      setOneTimeSecret({
        username: targetUser.username,
        secret: res.temporaryPassword,
      });
      toast({
        title: "Senha redefinida com sucesso",
        description: `A nova senha temporária para ${targetUser.username} foi gerada.`,
        type: "success",
      });
    } catch (err) {
      toast({
        title: "Erro ao resetar senha",
        description:
          parseApiError(err).detail || "Não foi possível gerar a nova senha.",
        type: "error",
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUserMutation.mutateAsync(deleteTarget.id);
      toast({
        title: "Membro excluído",
        description: `O usuário ${deleteTarget.username} foi removido da equipe.`,
        type: "success",
      });
      setDeleteTarget(null);
    } catch (err) {
      toast({
        title: "Erro ao excluir membro",
        description:
          parseApiError(err).detail || "Não foi possível excluir o usuário.",
        type: "error",
      });
    }
  };

  const handleCreateSuccess = (res: CreateTeamUserResponse) => {
    toast({
      title: "Membro cadastrado",
      description: `O usuário ${res.username} foi criado com sucesso.`,
      type: "success",
    });

    if (res.temporaryPassword) {
      setOneTimeSecret({
        username: res.username,
        secret: res.temporaryPassword,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header da Tela */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Equipe e Desempenho
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Gerencie garçons, permissões de acesso e acompanhe métricas de
            atendimento no salão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchUsers()}
            disabled={isRefetchingUsers}
            aria-label="Atualizar lista de membros"
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetchingUsers ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="gap-1.5"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Membro</span>
          </Button>
        </div>
      </div>

      {/* Abas: Membros vs Desempenho */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "members" | "metrics")}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
          <TabsList className="bg-zinc-100 p-1 dark:bg-zinc-800/80">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              <span>Membros</span>
              {!isLoadingUsers && (
                <span className="ml-1 rounded-full bg-zinc-200 px-2 py-0.5 text-[11px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                  {users.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="metrics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Desempenho dos Garçons</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === "members" && (
            <div className="w-full sm:w-64">
              <Input
                placeholder="Buscar por usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                startAdornment={<Search className="h-4 w-4 text-zinc-400" />}
                className="h-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* Aba 1: Membros */}
        <TabsContent value="members" className="pt-4">
          {isLoadingUsers ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6 text-zinc-500" />}
              title="Nenhum membro cadastrado"
              description="Adicione garçons ou gerentes para começar a operar as mesas e o salão."
              action={
                <Button
                  variant="primary"
                  onClick={() => setIsCreateOpen(true)}
                  className="gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Cadastrar Primeiro Membro</span>
                </Button>
              }
            />
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-800">
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Nenhum membro encontrado com o termo &ldquo;{search}&rdquo;.
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
            <TeamMembersList
              members={filteredUsers}
              currentUserId={currentUser?.id}
              currentUsername={currentUser?.username}
              onToggleStatus={handleToggleStatus}
              onResetPassword={(u) => setResetTarget(u)}
              onDelete={(u) => setDeleteTarget(u)}
              isTogglingId={togglingUserId}
            />
          )}
        </TabsContent>

        {/* Aba 2: Métricas de Desempenho */}
        <TabsContent value="metrics" className="pt-4">
          <AttendantMetricsView
            metrics={metricsData?.attendants ?? []}
            isLoading={isLoadingMetrics}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogo de Criação */}
      <CreateTeamUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Confirmação de Reset de Senha */}
      <ConfirmDialog
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        title="Redefinir Senha de Acesso"
        description={`Deseja gerar uma nova senha temporária para o usuário "${resetTarget?.username}"? A senha atual será invalidada imediatamente.`}
        confirmLabel="Gerar Nova Senha"
        isLoading={resetPasswordMutation.isPending}
        onConfirm={handleConfirmResetPassword}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Excluir Membro da Equipe"
        description={`Tem certeza que deseja excluir o usuário "${deleteTarget?.username}"? Esta ação removerá os acessos do usuário e não poderá ser desfeita.`}
        confirmLabel="Excluir Usuário"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
        onConfirm={handleConfirmDelete}
      />

      {/* Diálogo de Exibição Única da Senha */}
      {oneTimeSecret && (
        <OneTimeSecretDialog
          open={!!oneTimeSecret}
          onClose={() => setOneTimeSecret(null)}
          username={oneTimeSecret.username}
          secret={oneTimeSecret.secret}
        />
      )}
    </div>
  );
}
