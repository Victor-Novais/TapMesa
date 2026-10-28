import { AlertTriangle } from "lucide-react";

// Recusa de validação do back (INVALID_SERVICE_SETTINGS, INVALID_APPEARANCE):
// o `detail` fica visível junto ao formulário, além do toast
export function FormServerError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-control border border-danger/40 bg-danger-tint p-3 text-sm text-danger-ink"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{message}</p>
    </div>
  );
}
