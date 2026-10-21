"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { useToast } from "@/shared/ui/toast";
import { parseApiError } from "@/shared/api";
import { useNextTableNumberQuery } from "../api/use-tables-query";
import { useCreateTablesMutation } from "../api/use-table-mutations";
import { PlusCircle, Layers, AlertTriangle } from "lucide-react";

const batchCreateSchema = z.object({
  startNumber: z.coerce
    .number()
    .int("Deve ser um número inteiro")
    .min(1, "O número inicial deve ser no mínimo 1"),
  count: z.coerce
    .number()
    .int("Deve ser um número inteiro")
    .min(1, "Gere ao menos 1 mesa")
    .max(50, "O limite por lote é de 50 mesas"),
});

type BatchCreateFormData = z.infer<typeof batchCreateSchema>;

export interface BatchCreateTablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BatchCreateTablesDialog({
  open,
  onOpenChange,
}: BatchCreateTablesDialogProps) {
  const { toast } = useToast();
  const [conflictError, setConflictError] = React.useState<string | null>(null);

  const { data: nextNumberData, isLoading: isLoadingNextNumber } =
    useNextTableNumberQuery(open);
  const createTablesMutation = useCreateTablesMutation();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BatchCreateFormData>({
    resolver: zodResolver(batchCreateSchema),
    defaultValues: {
      startNumber: 1,
      count: 10,
    },
  });

  const startNumber = useWatch({
    control,
    name: "startNumber",
    defaultValue: 1,
  });
  const count = useWatch({
    control,
    name: "count",
    defaultValue: 10,
  });

  // Preenche automaticamente o próximo número sugerido pelo back-end ao abrir
  React.useEffect(() => {
    if (open) {
      if (nextNumberData?.nextNumber) {
        setValue("startNumber", nextNumberData.nextNumber);
      }
    } else {
      reset({ startNumber: 1, count: 10 });
    }
  }, [open, nextNumberData, setValue, reset]);

  const endNumber = React.useMemo(() => {
    const s = Number(startNumber);
    const c = Number(count);
    if (!isNaN(s) && !isNaN(c) && s >= 1 && c >= 1) {
      return s + c - 1;
    }
    return null;
  }, [startNumber, count]);

  const onSubmit = async (data: BatchCreateFormData) => {
    setConflictError(null);
    try {
      const createdTables = await createTablesMutation.mutateAsync({
        startNumber: data.startNumber,
        count: data.count,
      });

      const totalCreated = createdTables?.length || data.count;
      toast({
        title: "Mesas criadas com sucesso!",
        description: `${totalCreated} ${
          totalCreated === 1 ? "mesa foi cadastrada" : "mesas foram cadastradas"
        } e já estão prontas para atendimento.`,
        type: "success",
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      if (parsed.status === 409 || parsed.code === "DUPLICATE_TABLE_NUMBER") {
        if (parsed.duplicates && parsed.duplicates.length > 0) {
          setConflictError(
            `Já existem mesas cadastradas com os números: ${parsed.duplicates.join(
              ", ",
            )}. Escolha outro número inicial ou verifique a listagem.`,
          );
        } else {
          setConflictError(
            parsed.detail ||
              "Uma ou mais mesas neste intervalo já estão cadastradas.",
          );
        }
      } else {
        toast({
          title: "Erro ao cadastrar mesas",
          description: parsed.detail || "Verifique os dados e tente novamente.",
          type: "error",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Criar Mesas em Lote
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Gere sequências de mesas e QR Codes automaticamente para o
                salão.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {conflictError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/75 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {conflictError}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="startNumber"
              label="Número Inicial"
              type="number"
              min={1}
              helperText={
                isLoadingNextNumber
                  ? "Consultando próximo disponível..."
                  : "Próximo número livre sugerido"
              }
              error={errors.startNumber?.message}
              {...register("startNumber")}
            />

            <Input
              id="count"
              label="Quantidade de Mesas"
              type="number"
              min={1}
              max={50}
              helperText="De 1 a 50 mesas por lote"
              error={errors.count?.message}
              {...register("count")}
            />
          </div>

          {/* Cartão de pré-visualização das mesas geradas */}
          {endNumber !== null && (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
              <Layers className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-200">
                  Prévia do Lote:
                </p>
                <p className="mt-0.5">
                  Serão criadas{" "}
                  <strong className="text-zinc-950 dark:text-zinc-50 font-mono">
                    {count}
                  </strong>{" "}
                  {Number(count) === 1 ? "mesa" : "mesas"}: da{" "}
                  <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                    Mesa {startNumber}
                  </span>{" "}
                  até a{" "}
                  <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                    Mesa {endNumber}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6 flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTablesMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createTablesMutation.isPending}
            >
              Gerar Mesas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
