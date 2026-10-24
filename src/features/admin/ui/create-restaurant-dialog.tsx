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
import { useCreateAdminRestaurantMutation } from "../api/use-admin-mutations";
import { Building2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { CreateRestaurantResponse } from "@/shared/types/api";

const createRestaurantSchema = z.object({
  name: z
    .string()
    .min(2, "O nome do restaurante deve ter ao menos 2 caracteres")
    .max(100, "O nome deve ter no máximo 100 caracteres"),
  ownerUsername: z
    .string()
    .min(3, "O nome do proprietário deve ter ao menos 3 caracteres")
    .max(50, "O nome deve ter no máximo 50 caracteres")
    .regex(
      /^[a-zA-Z0-9_.-]+$/,
      "Apenas letras, números, sublinhado e hífen são permitidos",
    ),
});

type CreateRestaurantFormData = z.infer<typeof createRestaurantSchema>;

export interface CreateRestaurantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (data: CreateRestaurantResponse) => void;
}

export function CreateRestaurantDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateRestaurantDialogProps) {
  const [apiError, setApiError] = React.useState<string | null>(null);
  const createMutation = useCreateAdminRestaurantMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      ownerUsername: "",
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset({ name: "", ownerUsername: "" });
      setApiError(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CreateRestaurantFormData) => {
    setApiError(null);
    try {
      const result = await createMutation.mutateAsync({
        name: data.name.trim(),
        ownerUsername: data.ownerUsername.trim(),
      });
      handleOpenChange(false);
      onSuccess(result);
    } catch (err) {
      const parsed = parseApiError(err);
      if (parsed.status === 409 || parsed.code === "USERNAME_ALREADY_EXISTS") {
        setApiError(
          "Este nome de usuário do proprietário já está em uso na plataforma.",
        );
      } else {
        setApiError(
          parsed.detail || "Não foi possível cadastrar o restaurante.",
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
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-ink">
                Novo Restaurante
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-2">
                Cadastre um novo estabelecimento e gere as credenciais iniciais
                do proprietário.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {apiError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-control border border-danger/40 bg-danger-tint p-3 text-xs text-danger-ink"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-ink mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {apiError}
              </div>
            </div>
          )}

          <Input
            id="name"
            label="Nome do Estabelecimento"
            placeholder="ex: Bistrô Jardins"
            helperText="Nome comercial exibido na plataforma e nas mesas"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            id="ownerUsername"
            label="Usuário Administrador (Proprietário)"
            placeholder="ex: carlos_gerente"
            helperText="Login inicial com permissão total (OWNER) no restaurante"
            error={errors.ownerUsername?.message}
            {...register("ownerUsername")}
          />

          <div className="flex items-start gap-2 rounded-control bg-nav p-3 text-xs text-ink-2 border border-border">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary-ink mt-0.5" />
            <p>
              Uma senha temporária segura será gerada automaticamente e exibida
              para cópia logo após a confirmação.
            </p>
          </div>

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
              Cadastrar Estabelecimento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
