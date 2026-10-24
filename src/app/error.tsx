"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error in development if needed
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-ink">Algo deu errado</h1>
        <p className="text-sm text-ink-2">
          Ocorreu um erro inesperado ao carregar a página.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </main>
  );
}
