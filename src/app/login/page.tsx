import { Suspense } from "react";
import type { Metadata } from "next";
import { UtensilsCrossed, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta no TapMesa",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50/50 p-4 sm:p-6 dark:bg-zinc-950">
      <div className="w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/20">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            TapMesa
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Atendimento inteligente de mesas via QR Code
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-zinc-200/80 shadow-md dark:border-zinc-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Entrar na plataforma</CardTitle>
            <CardDescription>
              Informe suas credenciais para acessar o painel de atendimento ou
              gestão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                  <p className="text-xs text-zinc-500">
                    Carregando formulário...
                  </p>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
          TapMesa v1.0 • Sessão protegida em memória com dual-token
        </p>
      </div>
    </main>
  );
}
