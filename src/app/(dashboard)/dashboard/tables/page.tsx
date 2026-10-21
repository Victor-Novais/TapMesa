import type { Metadata } from "next";
import { TablesManager } from "@/features/tables";

export const metadata: Metadata = {
  title: "Mesas",
  description: "Gestão de mesas, status e impressão de QR Codes",
};

export default function TablesOverviewPage() {
  return <TablesManager />;
}
