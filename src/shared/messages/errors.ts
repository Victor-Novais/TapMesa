// Códigos `code` enviados pela API (docs/api/FRONTEND_INTEGRATION.md, seção 3).
// Erros de validação de DTO (400 "Validation Error") não têm `code`: exibimos o `detail`.
export const ERROR_MESSAGES: Record<string, string> = {
  // Login e sessão (401)
  INVALID_CREDENTIALS:
    "Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.",
  ACCOUNT_LOCKED:
    "Conta temporariamente bloqueada por 15 minutos após repetidas tentativas inválidas.",
  ACCOUNT_INACTIVE:
    "Esta conta de usuário está desativada. Entre em contato com o administrador.",
  USER_INACTIVE: "Usuário inativo. Contate o responsável pelo estabelecimento.",
  INVALID_REFRESH_TOKEN:
    "Sua sessão expirou. Por favor, realize o login novamente.",
  TOKEN_REUSE_DETECTED:
    "Tentativa de reutilização de sessão detectada por segurança. Faça login novamente.",
  // 403
  RESTAURANT_SUSPENDED:
    "As operações deste restaurante estão suspensas no momento.",
  // 404
  TABLE_NOT_FOUND:
    "Mesa não encontrada. O QR Code pode ser inválido ou a mesa foi desativada.",
  CALL_NOT_FOUND: "Chamado não encontrado. Ele pode já ter sido encerrado.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  RESTAURANT_NOT_FOUND: "Restaurante não encontrado.",
  // 409
  USERNAME_ALREADY_EXISTS:
    "Este nome de usuário já está em uso. Por favor, escolha outro nome.",
  ALERT_COOLDOWN_ACTIVE:
    "Um alerta urgente já foi enviado há pouco. Aguarde o intervalo configurado antes de enviar outro.",
  // 400
  INVALID_USERNAME:
    'Nome de usuário inválido. Use de 3 a 30 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado ("admin" é reservado).',
  TABLE_PAUSED:
    "Esta mesa está temporariamente pausada. Solicite assistência diretamente a um atendente.",
  INVALID_CALL_NOTE: "A observação deve ter no máximo 150 caracteres.",
  INVALID_CALL_TRANSITION:
    "Esta ação não é mais possível: o chamado mudou de situação. Atualize a tela.",
  INVALID_RATING:
    "Nota de avaliação inválida. As notas aceitas são 1 (Ruim), 2 (Regular) ou 3 (Bom).",
  INVALID_TABLE_NUMBER: "Número de mesa inválido.",
  INVALID_TABLE_BATCH_COUNT:
    "Quantidade de mesas inválida. Crie de 1 a 50 mesas por vez.",
  INVALID_CONFIRMATION_NAME:
    "O nome digitado não corresponde exatamente ao nome do restaurante para confirmação.",
  CANNOT_DELETE_SELF: "Você não pode excluir o seu próprio usuário.",
  CANNOT_MODIFY_OWN_STATUS: "Você não pode desativar o seu próprio usuário.",
  CANNOT_ASSIGN_ADMIN_ROLE:
    "Não é permitido atribuir o perfil de administrador a um membro da equipe.",
  INVALID_DATE_RANGE: "Período inválido. Verifique as datas informadas.",
  DATE_RANGE_EXCEEDS_LIMIT: "O período consultado pode ter no máximo 90 dias.",
  SUMMARY_EMAIL_DISABLED:
    "Ative o resumo diário por e-mail antes de enviar um teste.",
  URGENT_ALERT_DISABLED:
    "Ative os alertas urgentes por e-mail antes de enviar um teste.",
  // Upload de logo e fundo (docs/api/FEATURE_LOGO_UPLOAD.md, seção 3.3)
  FILE_TOO_LARGE: "A imagem deve ter no máximo 2 MB.",
  INVALID_IMAGE_FORMAT: "Use PNG, JPG ou WebP.",
  MISSING_FILE: "Selecione uma imagem.",
  // 413 / 429
  PAYLOAD_TOO_LARGE: "Os dados enviados excedem o tamanho máximo permitido.",
  TOO_MANY_REQUESTS:
    "Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.",
  // Códigos internos do front (sem resposta da API ou 403 sem `code`)
  NETWORK_ERROR:
    "Não foi possível conectar ao servidor. Verifique sua conexão com a internet.",
  FORBIDDEN:
    "Você não possui as permissões necessárias para acessar este recurso.",
  UNKNOWN_ERROR: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
};

// No upload, o 413 (corpo acima de 10 MB) é o mesmo caso do arquivo acima de 2 MB
export function getUploadErrorMessage(problem: {
  code?: string;
  status: number;
  detail?: string;
}): string {
  if (problem.status === 413 || problem.code === "PAYLOAD_TOO_LARGE") {
    return ERROR_MESSAGES.FILE_TOO_LARGE ?? "";
  }
  return getErrorMessage(problem.code, problem.detail);
}

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
