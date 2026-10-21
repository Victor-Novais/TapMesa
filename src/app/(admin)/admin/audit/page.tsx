import type { Metadata } from "next";
import { AuditLogsManager } from "@/features/admin";

export const metadata: Metadata = {
  title: "Auditoria",
  description: "Trilha global e imutável de auditoria administrativa",
};

export default function AdminAuditPage() {
  return <AuditLogsManager />;
}
