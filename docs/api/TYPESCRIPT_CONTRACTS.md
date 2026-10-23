# Contratos TypeScript Prontos para Uso — TapMesa Backend API

Este arquivo contém todas as definições de tipos, interfaces, DTOs e enums da API TapMesa prontos para serem copiados diretamente para o repositório frontend (`src/types/api.ts`).

---

```typescript
/**
 * TapMesa API — Contratos TypeScript Oficiais
 * Versão da API: 1.0.0
 * Prefixo Global: /api/v1
 */

// ============================================================================
// 1. ENUMS E TIPOS PRIMITIVOS
// ============================================================================

export type Role = 'ADMIN' | 'OWNER' | 'WAITER';

export type RestaurantStatus = 'ACTIVE' | 'SUSPENDED';

export type CallType = 'WAITER' | 'BILL';

export type CallStatus =
  | 'PENDING'
  | 'ATTENDED'
  | 'CONFIRMED'
  | 'CLOSED_UNCONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED';

/**
 * Avaliação rápida de 3 pontos (T26)
 * 1 = Ruim | 2 = Regular | 3 = Bom
 */
export type QuickRating = 1 | 2 | 3;

export type EventSourceKind = 'CUSTOMER' | 'STAFF' | 'SYSTEM';

export type BackgroundType = 'color' | 'image';

// ============================================================================
// 2. ERROS (RFC 7807 PROBLEM DETAILS)
// ============================================================================

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  requestId?: string;
  code?: string;
  duplicates?: number[];
}

// ============================================================================
// 3. IDENTIDADE E AUTENTICAÇÃO (/auth/*)
// ============================================================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

// GET /auth/me devolve as claims do access token (JWT), não um registro de usuário.
export interface AuthUser {
  sub: string; // id do usuário
  role: Role;
  rid?: string; // restaurantId (ausente para ADMIN fora de impersonação)
  imp?: string; // id do ADMIN quando o token é de impersonação
  iat: number;
  exp: number;
}

// ============================================================================
// 4. GESTÃO DE EQUIPE (/restaurant/users/*)
// ============================================================================

export interface CreateTeamUserRequest {
  username: string;
  role: 'OWNER' | 'WAITER';
  password?: string;
}

export interface CreateTeamUserResponse {
  id: string;
  restaurantId: string;
  username: string;
  role: 'OWNER' | 'WAITER';
  active: boolean;
  createdAt: string;
  temporaryPassword?: string; // presente quando a senha foi gerada pelo servidor
}

export interface TeamUser {
  id: string;
  restaurantId: string;
  username: string;
  role: Role;
  active: boolean;
  failedAttempts: number;
  isLocked: boolean;
  createdAt: string;
}

export interface UpdateTeamUserStatusRequest {
  active: boolean;
}

export interface AttendantMetric {
  userId: string;
  username: string;
  totalCallsAttended: number;
  avgResponseTimeSec: number;
  fastestResponseSec: number;
  slowestResponseSec: number;
}

export interface AttendantMetricsResponse {
  restaurantId: string;
  totalCallsAttended: number;
  waiters: AttendantMetric[];
}

// ============================================================================
// 5. RESTAURANTE, CONFIGURAÇÕES E APARÊNCIA
// ============================================================================

export interface RestaurantTenantInfo {
  id: string;
  name: string;
  status: RestaurantStatus;
  createdAt: string;
  impersonatedBy: string | null;
}

export interface ServiceSettings {
  responseGoalSec: number;
  alertSec: number;
  urgentSec: number;
  confirmationWindowSec: number;
  timezone: string;
  dayCutoffHour: number;
  showWaitTimeToCustomer: boolean;
}

export interface UpdateServiceSettingsRequest {
  responseGoalSec?: number;
  alertSec?: number;
  urgentSec?: number;
  confirmationWindowSec?: number;
  timezone?: string;
  dayCutoffHour?: number;
  showWaitTimeToCustomer?: boolean;
}

export interface RestaurantAppearance {
  name: string;
  description: string | null;
  logoUrl: string | null;
  backgroundType: BackgroundType;
  backgroundValue: string | null;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    [key: string]: string;
  };
  texts: {
    welcomeTitle: string;
    callWaiterButton: string;
    requestBillButton: string;
    notePlaceholder: string;
    pendingMessage: string;
    attendedPrompt: string;
    confirmButton: string;
    contestButton: string;
    cancelButton: string;
    [key: string]: string;
  };
  // Links externos normalizados para https; wifiName e wifiPassword são texto puro.
  socials: Record<string, string>;
}

export interface UpdateAppearanceRequest {
  name?: string;
  description?: string | null;
  backgroundType?: BackgroundType;
  backgroundValue?: string | null;
  colors?: Record<string, string>;
  texts?: Record<string, string>;
  socials?: Record<string, string | null | undefined>;
}

// ============================================================================
// 6. GESTÃO DE MESAS (/tables/*)
// ============================================================================

export interface CreateTablesRequest {
  startNumber: number;
  count?: number;
  quantity?: number;
}

export interface TableDto {
  id: string;
  restaurantId: string;
  number: number;
  token: string;
  paused: boolean;
  url: string; // URL canônica do QR: {PUBLIC_APP_URL}/m/{token}. Use-a no "Copiar link".
  createdAt: string;
}

export interface NextTableNumberResponse {
  nextNumber: number;
}

export interface PrintViewTable {
  id: string;
  number: number;
  token: string;
  paused: boolean;
  url: string;
  qrSvg: string;
}

export interface TablesPrintViewResponse {
  restaurant: {
    name: string;
    logoUrl: string | null;
  };
  tables: PrintViewTable[];
}

// ============================================================================
// 7. TELA PÚBLICA DA MESA DO CLIENTE (/public/tables/:token/*)
// ============================================================================

export interface PublicCallDto {
  id: string;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  attendedAt: string | null;
  acknowledgedAt?: string | null;
  rating: number | null;
  confirmationDeadline?: string | null;
  reopenCount: number;
  alreadyPending?: boolean;
  serverNow: string;
}

export interface PublicTableDto {
  tableNumber: number;
  available: boolean;
  unavailableReason: 'TABLE_PAUSED' | 'RESTAURANT_SUSPENDED' | null;
  message: string | null;
  showWaitTimeToCustomer: boolean;
  serverNow: string;
  appearance: {
    restaurantName: string;
    description: string | null;
    logoUrl: string | null;
    backgroundType: string;
    backgroundValue: string | null;
    colors: Record<string, string>;
    texts: Record<string, string>;
    socials: Record<string, string | null>;
  };
  calls: PublicCallDto[];
}

// GET /public/tables/:token/calls: chamados ativos da mesa (versão enxuta)
export interface PublicCallStateDto {
  id: string;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  attendedAt: string | null;
  confirmationDeadline: string | null;
  reopenCount: number;
  serverNow: string;
}

export interface CreatePublicCallRequest {
  type: CallType;
  note?: string;
}

export interface ConfirmCallRequest {
  rating?: QuickRating;
}

// ============================================================================
// 8. PAINEL EM TEMPO REAL DA EQUIPE (/panel/*)
// ============================================================================

export interface StreamTicketResponse {
  ticket: string;
  expiresInSec: number;
}

// Item de GET /panel/calls e de PanelStateDto.activeCalls.
export interface PanelCallDto {
  id: string;
  restaurantId: string;
  tableId: string | null;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string; // reinicia na contestação (base do cronômetro)
  originalCreatedAt: string; // abertura original do chamado
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  firstAttendedAt: string | null;
  reopenCount: number;
  reopened: boolean;
  contested: boolean;
  reactionTimeSec: number | null;
  serverNow: string;
}

// GET /panel/state e evento `snapshot` do SSE do painel.
export interface PanelStateDto {
  activeCalls: PanelCallDto[];
  recentCalls: RecentAttendedCallDto[];
  thresholds: {
    alertSec: number;
    urgentSec: number;
  };
  serverNow: string;
}

export interface AcknowledgedCallDto {
  id: string;
  restaurantId: string;
  tableId: string | null;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  originalCreatedAt: string;
  acknowledgedAt: string;
  acknowledgedById: string;
  reopenCount: number;
  reopened: boolean;
  contested: boolean;
  reactionTimeSec: number;
  alreadyAcknowledged: boolean;
  serverNow: string;
}

export interface AttendedCallDto {
  id: string;
  restaurantId: string;
  tableId: string | null;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  originalCreatedAt: string;
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  firstAttendedAt: string | null;
  attendedAt: string;
  attendedById: string;
  rating: number | null;
  reopenCount: number;
  reopened: boolean;
  contested: boolean;
  reactionTimeSec: number;
  executionTimeSec: number;
  alreadyAttended: boolean;
  serverNow: string;
}

export type ConfirmationStatus =
  'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'CONTESTED' | 'CLOSED_UNCONFIRMED';

export interface RecentAttendedCallDto {
  id: string;
  restaurantId: string;
  tableId: string | null;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  confirmationStatus: ConfirmationStatus;
  note: string | null;
  createdAt: string;
  originalCreatedAt: string;
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  firstAttendedAt: string | null;
  attendedAt: string;
  confirmedAt: string | null;
  closedAt: string | null;
  attendedById: string | null;
  rating: number | null;
  reopenCount: number;
  reopened: boolean;
  contested: boolean;
  reactionTimeSec: number | null;
  executionTimeSec: number | null;
  responseTimeSec: number | null;
  resolutionTimeSec: number | null;
  serverNow: string;
}

// ============================================================================
// 9. RESUMO DO DIA E ANALYTICS (/analytics/*)
// ============================================================================

export interface AnalyticsRange {
  from: string; // YYYY-MM-DD (dia operacional)
  to: string;
  daysCount: number;
}

export interface TimeStats {
  averageResponseTimeSec: number;
  medianResponseTimeSec: number;
  p90ResponseTimeSec: number;
  maxWaitTimeSec: number;
  sampleCount: number;
}

export interface CallMetrics {
  totalCalls: number;
  statusCounts: {
    pending: number;
    attended: number;
    confirmed: number;
    cancelled: number;
    expired: number;
    closed: number;
  };
  attendedCount: number;
  expiredCount: number;
  cancelledCount: number;
  reopenedCount: number;
  responseTimes: TimeStats; // abertura -> atendido
  reactionTimes: TimeStats; // abertura -> assumido (T26)
  executionTimes: TimeStats; // assumido -> atendido (T26)
  ratings: {
    '1': number;
    '2': number;
    '3': number;
    total: number;
    average: number | null;
  };
  percentageWithinTarget: number;
  confirmationRate: number;
}

export interface AnalyticsSummaryOverview extends CallMetrics {
  waiterCalls: number;
  billCalls: number;
}

export interface HourlyMetric {
  hour: number; // 0..23
  totalCalls: number;
  waiterCalls: number;
  billCalls: number;
  attendedCalls: number;
  averageResponseTimeSec: number;
  averageWaiterResponseTimeSec: number;
  averageBillResponseTimeSec: number;
}

export interface TableRankingItem {
  tableNumber: number;
  totalCalls: number;
  attendedCalls: number;
  averageResponseTimeSec: number;
}

export interface TableRanking {
  byVolume: TableRankingItem[];
  byResponseTime: TableRankingItem[];
}

export interface TablesRankingByType {
  all: TableRanking;
  waiter: TableRanking;
  bill: TableRanking;
}

export interface AnalyticsMetrics {
  overview: AnalyticsSummaryOverview;
  byType: { waiter: CallMetrics; bill: CallMetrics };
  byHour: HourlyMetric[];
  ranking: TablesRankingByType;
}

export interface AnalyticsSummaryResponse {
  range: AnalyticsRange;
  summary: AnalyticsMetrics;
  serverNow: string;
}

export interface AnalyticsByHourResponse {
  range: AnalyticsRange;
  byHour: HourlyMetric[];
  serverNow: string;
}

export interface TablesRankingResponse {
  range: AnalyticsRange;
  ranking: TablesRankingByType;
  serverNow: string;
}

export interface AnalyticsCompareDay {
  day: string;
  metrics: AnalyticsMetrics;
  delta?: {
    deltaTotalCalls: number;
    deltaAverageResponseTimeSec: number;
    deltaPercentageWithinTarget: number;
    deltaConfirmationRate: number;
  };
}

// GET /analytics/summary/compare (delta = hoje menos o dia comparado)
export interface AnalyticsCompareResponse {
  today: AnalyticsCompareDay;
  yesterday: AnalyticsCompareDay;
  sameDayLastWeek: AnalyticsCompareDay;
  serverNow: string;
}

export interface AnalyticsCallItem {
  id: string;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  firstAttendedAt: string | null;
  attendedAt: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  expiredAt: string | null;
  closedAt: string | null;
  rating: number | null;
  reactionTimeSec: number | null;
  executionTimeSec: number | null;
  responseTimeSec: number | null;
  resolutionTimeSec: number | null;
  confirmationTimeSec: number | null;
  reopenCount: number;
  contested: boolean;
}

export interface AnalyticsCallsResponse {
  items: AnalyticsCallItem[];
  nextCursor: string | null; // null = não há mais páginas
  totalCount: number;
  serverNow: string;
}

// ============================================================================
// 10. NOTIFICAÇÕES (/restaurant/notifications/*)
// ============================================================================

export interface NotificationSettingsDto {
  restaurantId: string;
  emailSummaryEnabled: boolean;
  summaryEmailRecipient?: string; // ausente até ser configurado
  urgentAlertEnabled: boolean;
  urgentAlertRecipient?: string;
  alertCooldownMinutes: number;
}

export interface UpdateNotificationSettingsRequest {
  emailSummaryEnabled?: boolean;
  summaryEmailRecipient?: string;
  urgentAlertEnabled?: boolean;
  urgentAlertRecipient?: string;
  alertCooldownMinutes?: number;
}

// ============================================================================
// 11. MAPA DE EVENTOS EM TEMPO REAL (SSE EVENT MAP)
// ============================================================================

// Nomes exatos do campo `event:` do SSE. Fonte: ServiceCallEvents.ts e
// DomainToRealtimeEventHandler.ts. Pausar/retomar mesa NÃO emite evento SSE.
export type CallEventType =
  | 'OPENED'
  | 'ACKNOWLEDGED'
  | 'ATTENDED'
  | 'CONFIRMED'
  | 'REOPENED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'CLOSED_UNCONFIRMED';

// Canal do painel (GET /panel/stream): payload completo do evento.
export interface PanelCallEventData {
  callId: string;
  restaurantId: string;
  tableId: string | null;
  actorUserId: string | null;
  // Em `call.opened` este campo traz o tipo do chamado (WAITER | BILL);
  // nos demais eventos traz o CallEventType.
  type: CallEventType | CallType;
  source: EventSourceKind;
  occurredAt: string;
  note?: string | null; // call.opened
  tableNumber?: number; // call.opened
  rating?: number; // call.confirmed (1 a 3)
  reopenCount?: number; // call.reopened
}

// Canal da mesa (GET /public/tables/:token/stream): payload reduzido (RNF-09),
// sem restaurantId nem dados de outras mesas.
export interface PublicCallEventData {
  callId: string;
  tableId: string;
  type: CallEventType;
  actorUserId: string | null;
  occurredAt: string;
  tableNumber?: number;
}

type CallEventName =
  | 'call.opened'
  | 'call.acknowledged'
  | 'call.attended'
  | 'call.confirmed'
  | 'call.reopened'
  | 'call.cancelled'
  | 'call.expired'
  | 'call.closed';

export type PanelRealtimeEventMap = {
  snapshot: PanelStateDto;
  'table.removed': { tableId: string; tableNumber: number; occurredAt: string };
  'alert.raised': {
    restaurantId: string;
    tableNumber: number;
    callType: CallType;
    waitDurationSec: number;
    urgentThresholdSec: number;
    note: string | null;
    raisedAt: string;
  };
} & Record<CallEventName, PanelCallEventData>;

export type PublicTableRealtimeEventMap = {
  snapshot: unknown; // estado atual da mesa + serverNow
  // Enviado imediatamente antes de o servidor encerrar a conexão.
  'table.removed': { message: string };
} & Record<CallEventName, PublicCallEventData>;
```
