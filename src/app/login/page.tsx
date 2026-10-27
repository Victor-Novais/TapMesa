import { Suspense } from "react";
import type { Metadata } from "next";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/shared/ui/card";
import { BrandLogo } from "@/shared/ui/brand-logo";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse sua conta no Aproxime Aí",
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4 sm:p-6 focus:outline-none"
    >
      <div className="w-full max-w-105 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <BrandLogo size={56} alt="" priority />
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
            Aproxime Aí
          </h1>
          <p className="mt-1 text-sm text-ink-2">
            Atendimento inteligente de mesas via QR Code
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1 pb-4">
            {/* h2: segue o h1 "Aproxime Aí" na hierarquia de títulos */}
            <h2 className="text-xl font-semibold leading-tight tracking-tight text-ink">
              Entrar na plataforma
            </h2>
            <CardDescription>
              Informe suas credenciais para acessar o painel de atendimento ou
              gestão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex h-48 flex-col items-center justify-center gap-2">
                  <Loader2
                    className="h-6 w-6 animate-spin text-brand"
                    aria-hidden
                  />
                  <p className="text-xs text-ink-2">Carregando formulário...</p>
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-ink-2">
          Aproxime Aí v1.0 • Sessão protegida em memória com dual-token
        </p>
      </div>
    </main>
  );
}
