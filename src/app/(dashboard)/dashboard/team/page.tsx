import type { Metadata } from "next";
import { TeamManager } from "@/features/team";

export const metadata: Metadata = {
  title: "Equipe",
  description: "Gestão da equipe de atendentes e garçons",
};

export default function TeamOverviewPage() {
  return <TeamManager />;
}
