import { AxiosError } from "axios";
import type { ProblemDetails } from "@/shared/types/api";
import { getErrorMessage } from "@/shared/messages/errors";

export function parseApiError(error: unknown): ProblemDetails {
  if (error instanceof AxiosError) {
    if (error.response?.data && typeof error.response.data === "object") {
      const data = error.response.data as Partial<ProblemDetails>;
      const code = data.code;
      const status = error.response.status;

      let detail = data.detail || "";
      if (code) {
        detail = getErrorMessage(code, detail);
      } else if (status === 429) {
        detail = getErrorMessage("TOO_MANY_REQUESTS");
      } else if (status === 409 && Array.isArray(data.duplicates)) {
        detail = `Já existem mesas cadastradas com os seguintes números: ${data.duplicates.join(", ")}.`;
      } else if (!detail) {
        detail = getErrorMessage(undefined, error.message);
      }

      return {
        type: data.type || "about:blank",
        title: data.title || "Erro na Operação",
        status: status,
        detail: detail,
        instance: data.instance || "",
        requestId: data.requestId,
        code: code,
        duplicates: data.duplicates,
        errors: data.errors,
      };
    }

    if (error.response?.status === 429) {
      return {
        type: "about:blank",
        title: "Limite Excedido",
        status: 429,
        detail: getErrorMessage("TOO_MANY_REQUESTS"),
        instance: "",
        code: "TOO_MANY_REQUESTS",
      };
    }

    // Network / offline error
    if (!error.response) {
      return {
        type: "about:blank",
        title: "Sem Conexão",
        status: 0,
        detail: getErrorMessage("NETWORK_ERROR"),
        instance: "",
        code: "NETWORK_ERROR",
      };
    }
  }

  return {
    type: "about:blank",
    title: "Erro Inesperado",
    status: 500,
    detail: getErrorMessage("UNKNOWN_ERROR"),
    instance: "",
    code: "UNKNOWN_ERROR",
  };
}
