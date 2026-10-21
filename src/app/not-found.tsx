import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Página não encontrada
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          O endereço informado não existe ou foi movido.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
