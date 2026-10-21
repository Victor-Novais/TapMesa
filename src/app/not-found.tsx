import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-zinc-100 text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
          <Compass className="h-8 w-8 text-orange-600 animate-spin-slow" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
          Página não encontrada
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
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
