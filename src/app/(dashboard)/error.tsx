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

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Dashboard route error:", error.message);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-500/30">
        <CardHeader>
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <CardTitle>{UI_MESSAGES.common.errorTitle}</CardTitle>
          <CardDescription>
            {UI_MESSAGES.common.errorDescription} Por favor, tente recarregar ou
            volte mais tarde.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {UI_MESSAGES.common.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
