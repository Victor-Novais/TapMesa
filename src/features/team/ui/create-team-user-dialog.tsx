"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { parseApiError } from "@/shared/api";
import { useCreateTeamUserMutation } from "../api/use-team-mutations";
import { UserPlus, AlertTriangle } from "lucide-react";
import type { CreateTeamUserResponse } from "@/shared/types/api";

const createTeamUserSchema = z.object({
  username: z
    .string()
    .min(3, "O nome de usuário deve ter ao menos 3 caracteres")
    .max(50, "O nome de usuário deve ter no máximo 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Apenas letras, números, sublinhado e hífen são permitidos",
    ),
  role: z.enum(["WAITER", "OWNER"] as const, {
    message: "Selecione um papel válido",
  }),
  password: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Se fornecida, a senha deve ter ao menos 6 caracteres",
    }),
});

type CreateTeamUserFormData = z.infer<typeof createTeamUserSchema>;

export interface CreateTeamUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: CreateTeamUserResponse) => void;
}

export function CreateTeamUserDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamUserDialogProps) {
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const createMutation = useCreateTeamUserMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamUserFormData>({
    resolver: zodResolver(createTeamUserSchema),
    defaultValues: {
      username: "",
      role: "WAITER",
      password: "",
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset({ username: "", role: "WAITER", password: "" });
      setConflictError(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateTeamUserFormData) => {
    setConflictError(null);
    try {
      const payload = {
        username: data.username.trim(),
        role: data.role,
        ...(data.password ? { password: data.password } : {}),
      };

      const result = await createMutation.mutateAsync(payload);
      onOpenChange(false);
      onSuccess(result);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 409 || parsed.code === "USERNAME_ALREADY_EXISTS") {
        setConflictError(
          "Este nome de usuário já está em uso no sistema. Por favor, escolha outro nome.",
        );
      } else {
        setConflictError(
          parsed.detail || "Não foi possível cadastrar o membro da equipe.",
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-brand-tint text-primary-ink">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-ink">
                Novo Membro da Equipe
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-2">
                Cadastre garçons para o salão ou administradores para o
                restaurante.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {conflictError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-control border border-danger/40 bg-danger-tint p-3 text-xs text-danger-ink"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-ink mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {conflictError}
              </div>
            </div>
          )}

          {/* Nome de Usuário */}
          <Input
            id="username"
            label="Nome de Usuário"
            placeholder="ex: garcom_carlos"
            helperText="Usado para login no Painel ou Dashboard"
            error={errors.username?.message}
            {...register("username")}
          />

          {/* Papel / Permissão */}
          <div className="space-y-1.5 text-left">
            <label
              htmlFor="role"
              className="block text-sm font-medium text-ink-2"
            >
              Função no Restaurante
            </label>
            <select
              id="role"
              className="flex h-11 w-full rounded-control border border-border bg-surface px-3.5 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring"
              {...register("role")}
            >
              <option value="WAITER">
                Garçom (Acesso ao Painel Operacional)
              </option>
              <option value="OWNER">Gerente / Dono (Acesso Completo)</option>
            </select>
          </div>

          {/* Senha Inicial (Opcional) */}
          <Input
            id="password"
            label="Senha Inicial (Opcional)"
            type="password"
            placeholder="Deixe em branco para gerar automaticamente"
            helperText="Se não informada, uma senha temporária segura será gerada"
            error={errors.password?.message}
            {...register("password")}
          />

          <DialogFooter className="mt-6 flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createMutation.isPending}
            >
              Criar Membro
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
