export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          TapMesa
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          SaaS multi-tenant para chamada de garçom e pedido de conta via QR
          Code.
        </p>
      </div>
    </main>
  );
}
