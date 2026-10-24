import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-canvas p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center text-ink-3">
          <Compass className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-ink">404</h1>
        <h2 className="text-xl font-semibold text-ink">
          Página não encontrada
        </h2>
        <p className="text-sm text-ink-2">
          O endereço informado não existe ou foi movido. Verifique o link e
          tente novamente.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
