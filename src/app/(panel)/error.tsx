"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { UI_MESSAGES } from "@/shared/messages/ui";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Panel route error:", error.message);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger-tint text-danger-ink">
            <AlertCircle className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle>Erro no Painel de Atendimento</CardTitle>
          <CardDescription>
            Não foi possível carregar a fila de chamados operacionais.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden />
            {UI_MESSAGES.common.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
