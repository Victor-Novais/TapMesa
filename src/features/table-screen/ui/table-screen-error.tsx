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
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-canvas p-6 text-center text-ink">
        <Card className="w-full border-t-[3px] border-t-border-control">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="mb-2 flex items-center justify-center text-ink-2">
              <QrCode className="h-10 w-10" strokeWidth={1.5} aria-hidden />
            </div>
            <CardTitle className="text-xl text-balance">
              Mesa não encontrada
            </CardTitle>
            <CardDescription className="pt-1 text-sm text-pretty">
              {message ||
                "O QR Code escaneado não é válido ou a mesa correspondente foi desativada. Solicite assistência diretamente a um garçom no restaurante."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-ink-2">
            TapMesa • Atendimento inteligente
          </CardContent>
        </Card>
      </main>
    );
  }

  if (type === "PAUSED" || type === "SUSPENDED") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-canvas p-6 text-center text-ink">
        <Card className="w-full border-t-[3px] border-t-warning">
          <CardHeader className="flex flex-col items-center pb-2">
            <div className="mb-2 flex items-center justify-center text-warning-ink">
              <PauseCircle
                className="h-10 w-10"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <CardTitle className="text-xl text-balance">
              Atendimento temporariamente pausado
            </CardTitle>
            <CardDescription className="pt-1 text-sm text-pretty">
              {message ||
                "Esta mesa está com o atendimento digital em pausa. Por favor, solicite seu pedido ou atendimento diretamente à nossa equipe de garçons."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs text-ink-2">
            Agradecemos a compreensão.
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center bg-canvas p-6 text-center text-ink">
      <Card className="w-full border-t-[3px] border-t-danger">
        <CardHeader className="flex flex-col items-center pb-2">
          <div className="mb-2 flex items-center justify-center text-danger-ink">
            <WifiOff className="h-10 w-10" strokeWidth={1.5} aria-hidden />
          </div>
          <CardTitle className="text-xl text-balance">
            Falha na conexão
          </CardTitle>
          <CardDescription className="pt-1 text-sm text-pretty">
            {message ||
              "Não foi possível carregar as informações desta mesa. Verifique se o seu dispositivo está conectado à internet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 flex justify-center">
          {onRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
