export const ERROR_MESSAGES: Record<string, string> = {
  TABLE_NOT_FOUND:
    "Mesa não encontrada. O QR Code pode ser inválido ou a mesa foi desativada.",
  TABLE_PAUSED:
    "Esta mesa está temporariamente pausada. Solicite assistência diretamente a um atendente.",
  INVALID_CREDENTIALS:
    "Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.",
  ACCOUNT_LOCKED:
    "Conta temporariamente bloqueada por 15 minutos após repetidas tentativas inválidas.",
  ACCOUNT_INACTIVE:
    "Esta conta de usuário está desativada. Entre em contato com o administrador.",
  USER_INACTIVE: "Usuário inativo. Contate o responsável pelo estabelecimento.",
  RESTAURANT_SUSPENDED:
    "As operações deste restaurante estão suspensas no momento.",
  TOKEN_REUSE_DETECTED:
    "Tentativa de reutilização de sessão detectada por segurança. Faça login novamente.",
  INVALID_REFRESH_TOKEN:
    "Sua sessão expirou. Por favor, realize o login novamente.",
  USERNAME_ALREADY_EXISTS:
    "Este nome de usuário já está em uso. Por favor, escolha outro nome.",
  CONFIRMATION_NAME_MISMATCH:
    "O nome digitado não corresponde exatamente ao nome do restaurante para confirmação.",
  CANNOT_IMPERSONATE_SUSPENDED_RESTAURANT:
    "Não é possível acessar o painel de um restaurante que está suspenso.",
  INVALID_RATING:
    "Nota de avaliação inválida. As notas aceitas são 1 (Ruim), 2 (Regular) ou 3 (Bom).",
  VALIDATION_ERROR:
    "Dados inválidos fornecidos. Verifique os campos preenchidos e tente novamente.",
  FILE_TOO_LARGE: "O arquivo excede o limite máximo permitido de 2 MB.",
  INVALID_IMAGE_FORMAT:
    "Formato de imagem não aceito. Envie um arquivo nos formatos JPEG, PNG ou WebP.",
  MISSING_FILE: "Nenhum arquivo de imagem foi selecionado para upload.",
  TOO_MANY_REQUESTS:
    "Muitas requisições em curto intervalo. Aguarde alguns instantes antes de tentar novamente.",
  NETWORK_ERROR:
    "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
  UNAUTHORIZED:
    "Você não tem autorização para realizar esta operação. Faça login novamente.",
  FORBIDDEN:
    "Você não possui as permissões necessárias para acessar este recurso.",
  UNKNOWN_ERROR: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
};

export function getErrorMessage(
  code?: string,
  defaultMessage?: string,
): string {
  if (code && typeof ERROR_MESSAGES[code] === "string") {
    return ERROR_MESSAGES[code];
  }
  return (
    defaultMessage ||
    ERROR_MESSAGES.UNKNOWN_ERROR ||
    "Ocorreu um erro inesperado."
  );
}
