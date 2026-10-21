"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import type { Role } from "@/shared/types/api";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { useAuthStore } from "../model/auth-store";
import { getDefaultPathForRole } from "../lib/redirect";

interface AuthGateProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function AuthGate({ children, allowedRoles }: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, impersonation } = useAuthStore();

  useEffect(() => {
    if (status === "anonymous") {
      const nextParam = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${nextParam}`);
    }
  }, [status, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Carregando sessão...
          </p>
        </div>
      </div>
    );
  }

  if (status === "anonymous") {
    return null;
  }

  if (!user) {
    return null;
  }

  const role = user.role;
  const isAllowed = !allowedRoles || allowedRoles.includes(role);

  // If user is ADMIN on dashboard without active impersonation
  if (!isAllowed && role === "ADMIN" && !impersonation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-alert/30">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-alert/10 text-alert">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle>Painel do Administrador Geral</CardTitle>
            <CardDescription>
              Você está autenticado como Administrador Geral da plataforma. Para
              gerenciar um restaurante específico, utilize a opção &quot;Entrar
              como restaurante&quot; no Portal Administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button onClick={() => router.push("/admin")}>
              Ir para Portal Administrativo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Access denied for other roles
  if (!isAllowed) {
    const homePath = getDefaultPathForRole(role);
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-danger/30">
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-danger/10 text-danger">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <CardTitle>Acesso não autorizado</CardTitle>
            <CardDescription>
              Seu perfil ({role}) não possui permissão para acessar esta área do
              sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end gap-2">
            <Button onClick={() => router.push(homePath)}>
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
