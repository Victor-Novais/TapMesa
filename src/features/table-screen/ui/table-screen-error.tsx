"use client";

import { QrCode, PauseCircle, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";

export type TableErrorType = "NOT_FOUND" | "PAUSED" | "SUSPENDED" | "NETWORK";

interface TableScreenErrorProps {
  type: TableErrorType;
  message?: string | null;
  onRetry?: () => void;
}

export function TableScreenError({
  type,
  message,
  onRetry,
}: TableScreenErrorProps) {
  if (type === "NOT_FOUND") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <Card className="w-full border-zinc-200/80 shadow-md dark:border-zinc-800">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 mb-2 dark:bg-zinc-800 dark:text-zinc-400">
              <QrCode className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">Mesa não encontrada</CardTitle>
            <CardDescription className="text-sm pt-1">
              {message ||
                "O QR Code escaneado não é válido ou a mesa correspondente foi desativada. Solicite assistência diretamente a um garçom no restaurante."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-zinc-400">
            TapMesa • Atendimento inteligente
          </CardContent>
        </Card>
      </main>
    );
  }

  if (type === "PAUSED" || type === "SUSPENDED") {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <Card className="w-full border-amber-500/30 shadow-md">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-2 dark:text-amber-400">
              <PauseCircle className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">
              Atendimento temporariamente pausado
            </CardTitle>
            <CardDescription className="text-sm pt-1">
              {message ||
                "Esta mesa está com o atendimento digital em pausa. Por favor, solicite seu pedido ou atendimento diretamente à nossa equipe de garçons."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-zinc-400">
            Agradecemos a compreensão.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <Card className="w-full border-red-500/20 shadow-md">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 mb-2 dark:text-red-400">
            <WifiOff className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl">Falha na conexão</CardTitle>
          <CardDescription className="text-sm pt-1">
            {message ||
              "Não foi possível carregar as informações desta mesa. Verifique se o seu dispositivo está conectado à internet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
