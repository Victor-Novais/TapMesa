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
    // div em vez de main: o landmark <main> fica dentro da própria tela (evita main aninhado).
    // data-surface claro cobre carregamento e erro antes do tema do restaurante chegar,
    // para a mesa nunca seguir o modo escuro do celular (DESIGN_PLAN Q4).
    <div data-surface="table-light" className="min-h-dvh w-full">
      <TableScreenView token={token} />
    </div>
  );
}
