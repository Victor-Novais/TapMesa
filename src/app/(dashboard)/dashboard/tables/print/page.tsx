import type { Metadata } from "next";
import { TablesPrintView } from "@/features/tables";

export const metadata: Metadata = {
  title: "Impressão de QR Codes",
  description: "Folha de impressão em folha A4 dos QR Codes das mesas",
};

export default function TablesPrintPage() {
  return <TablesPrintView />;
}
