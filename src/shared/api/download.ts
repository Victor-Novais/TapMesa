import { api } from "./client";

/**
 * Realiza download autenticado via requisição GET com Authorization Header,
 * convertendo a resposta em Blob e disparando o download no browser.
 */
export async function downloadAuthenticated(
  url: string,
  filename: string,
): Promise<void> {
  const response = await api.get(url, {
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  // Limpeza de memória
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
