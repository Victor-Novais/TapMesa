import { AxiosError } from "axios";
import type { ProblemDetails } from "@/shared/types/api";
import { getErrorMessage } from "@/shared/messages/errors";

export function parseApiError(error: unknown): ProblemDetails {
  if (error instanceof AxiosError) {
    if (error.response?.data && typeof error.response.data === "object") {
      const data = error.response.data as Partial<ProblemDetails>;
      const code = data.code;
      const status = error.response.status;

      // Sem `code` (ex.: 400 "Validation Error"), o `detail` da API é exibido
      let detail = data.detail || "";
      if (code) {
        detail = getErrorMessage(code, detail);
      } else if (status === 429) {
        detail = getErrorMessage("TOO_MANY_REQUESTS");
      } else if (status === 403) {
        detail = getErrorMessage("FORBIDDEN");
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
        retryAfter: data.retryAfter,
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

    // 413 de um proxy chega sem o JSON da API
    if (error.response?.status === 413) {
      return {
        type: "about:blank",
        title: "Arquivo Muito Grande",
        status: 413,
        detail: getErrorMessage("PAYLOAD_TOO_LARGE"),
        instance: "",
        code: "PAYLOAD_TOO_LARGE",
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

export const parseProblemDetails = parseApiError;
