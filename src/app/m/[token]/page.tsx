import type { Metadata } from "next";
import { TableScreenView } from "@/features/table-screen";

interface PublicTablePageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicTablePageProps): Promise<Metadata> {
  const { token } = await params;

  return {
    title: "Atendimento de Mesa",
    description: `Acesso ao cardápio e chamado da mesa ${token}`,
    robots: {
      index: false,
      follow: false,
    },
    referrer: "no-referrer",
  };
}

export default async function PublicTablePage({
  params,
}: PublicTablePageProps) {
  const { token } = await params;

  return (
    <main className="min-h-[100dvh] w-full">
      <TableScreenView token={token} />
    </main>
  );
}
