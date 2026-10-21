import { notFound } from "next/navigation";

interface TablePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublicTablePage({ params }: TablePageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-3">
        <h1 className="text-xl font-bold">Mesa TapMesa</h1>
        <p className="text-sm text-zinc-500">Token da mesa: {token}</p>
      </div>
    </main>
  );
}
