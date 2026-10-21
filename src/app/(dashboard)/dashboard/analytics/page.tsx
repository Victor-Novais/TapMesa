import type { Metadata } from "next";
import { AnalyticsView } from "@/features/analytics";

export const metadata: Metadata = {
  title: "Resumo Operacional",
  description:
    "Visão geral da operação, métricas de chamados e tempos de atendimento",
};

export default function DashboardAnalyticsPage() {
  return <AnalyticsView />;
}
