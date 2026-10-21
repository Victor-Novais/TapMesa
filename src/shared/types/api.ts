/**
 * TapMesa API — Contratos TypeScript Oficiais
 * Versão da API: 1.0.0
 * Prefixo Global: /api/v1
 */

// ============================================================================
// 1. ENUMS E TIPOS PRIMITIVOS
// ============================================================================

export type Role = "ADMIN" | "OWNER" | "WAITER";

export type RestaurantStatus = "ACTIVE" | "SUSPENDED";

export type CallType = "WAITER" | "BILL";

export type CallStatus =
  | "PENDING"
  | "ATTENDED"
  | "CONFIRMED"
  | "CLOSED_UNCONFIRMED"
  | "CANCELLED"
  | "EXPIRED";

export type QuickRating = 1 | 2 | 3;

export type EventSourceKind = "CUSTOMER" | "STAFF" | "SYSTEM";

export type BackgroundType = "color" | "image" | "preset";

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
  errors?: Record<string, string[]>;
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

export interface AuthUser {
  id?: string;
  sub: string;
  username?: string;
  role: Role;
  restaurantId?: string;
  rid?: string;
  imp?: string | null;
  iat?: number;
  exp?: number;
}

// ============================================================================
// 4. GESTÃO DE EQUIPE (/restaurant/users/*)
// ============================================================================

export interface CreateTeamUserRequest {
  username: string;
  role: "OWNER" | "WAITER";
  password?: string;
}

export interface CreateTeamUserResponse {
  id: string;
  username: string;
  role: "OWNER" | "WAITER";
  active: boolean;
  temporaryPassword?: string;
}

export interface TeamUser {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface UpdateTeamUserStatusRequest {
  active: boolean;
}

export interface ResetTeamUserPasswordResponse {
  temporaryPassword: string;
}

export interface AttendantMetric {
  userId: string;
  username: string;
  totalAttended: number;
  averageReactionTimeSec: number;
  averageExecutionTimeSec: number;
  averageRating: number | null;
}

export interface AttendantMetricsResponse {
  attendants: AttendantMetric[];
}

// ============================================================================
// 5. RESTAURANTE, CONFIGURAÇÕES E APARÊNCIA
// ============================================================================

export interface RestaurantTenantInfo {
  id: string;
  name: string;
  status: RestaurantStatus;
  timezone: string;
  dayCutoffHour: number;
  alertSec: number;
  urgentSec: number;
  responseGoalSec: number;
  confirmationWindowSec: number;
  showWaitTimeToCustomer: boolean;
  impersonatedBy?: string | null;
}

export interface ServiceSettings {
  restaurantId: string;
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
  restaurantId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  backgroundType: BackgroundType;
  backgroundValue: string | null;
  colors: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    [key: string]: string | undefined;
  };
  texts: {
    welcomeTitle?: string;
    waiterButton?: string;
    billButton?: string;
    [key: string]: string | undefined;
  };
  socials: {
    instagram?: string;
    wifiName?: string;
    wifiPassword?: string;
    [key: string]: string | null | undefined;
  };
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
  count: number;
}

export interface TableDto {
  id: string;
  restaurantId: string;
  number: number;
  token: string;
  paused: boolean;
  createdAt: string;
}

export interface NextTableNumberResponse {
  nextNumber: number;
}

export interface PrintViewTable {
  id: string;
  number: number;
  token: string;
  qrCodeSvg: string;
  url: string;
}

export interface TablesPrintViewResponse {
  restaurantName: string;
  logoUrl: string | null;
  primaryColor: string;
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
  contested?: boolean;
  alreadyPending?: boolean;
  serverNow: string;
}

export interface PublicTableDto {
  tableNumber: number;
  available: boolean;
  unavailableReason: "TABLE_PAUSED" | "RESTAURANT_SUSPENDED" | null;
  message: string | null;
  showWaitTimeToCustomer: boolean;
  serverNow: string;
  appearance: {
    restaurantName?: string;
    name?: string;
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

export interface CreatePublicCallRequest {
  type: CallType;
  note?: string; // Max 140 chars
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

export interface PanelCallDto {
  id: string;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  note: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedById: string | null;
  firstAttendedAt: string | null;
  attendedAt: string | null;
  attendedById?: string | null;
  rating?: number | null;
  reopenCount: number;
  reactionTimeSec?: number | null;
  executionTimeSec?: number | null;
  serverNow: string;
}

export interface PanelStateDto {
  calls: PanelCallDto[];
  alertSec: number;
  urgentSec: number;
  activeCallsCount: number;
  waiterCallsCount: number;
  billCallsCount: number;
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

export interface RecentAttendedCallDto {
  id: string;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  attendedAt: string;
  rating: number | null;
  executionTimeSec: number;
  serverNow: string;
}

// ============================================================================
// 9. RESUMO DO DIA E ANALYTICS (/analytics/*)
// ============================================================================

export interface AnalyticsSummaryOverview {
  totalCalls: number;
  waiterCalls: number;
  billCalls: number;
  completedCalls: number;
  cancelledCalls: number;
  expiredCalls: number;
  percentageWithinTarget: number;
  responseTimes: {
    averageResponseTimeSec: number;
    medianResponseTimeSec: number;
    p90ResponseTimeSec: number;
    p95ResponseTimeSec: number;
  };
  ratings: {
    average: number | null;
    totalRated: number;
  };
}

export interface AnalyticsSummaryResponse {
  range: {
    from: string;
    to: string;
  };
  summary: {
    overview: AnalyticsSummaryOverview;
    ranking?: unknown;
  };
}

export interface HourlyMetric {
  hour: number;
  totalCalls: number;
  averageWaitSec: number;
}

export interface AnalyticsByHourResponse {
  hourly: HourlyMetric[];
}

export interface TableRankingItem {
  tableNumber: number;
  totalCalls: number;
  averageWaitSec: number;
}

export interface TablesRankingResponse {
  ranking: {
    byVolume: TableRankingItem[];
    byWaitTime: TableRankingItem[];
  };
}

export interface AnalyticsCallItem {
  id: string;
  tableNumber: number;
  type: CallType;
  status: CallStatus;
  createdAt: string;
  attendedAt: string | null;
  confirmedAt: string | null;
  rating: number | null;
  reopenCount: number;
  reactionTimeSec: number | null;
  executionTimeSec: number | null;
}

export interface AnalyticsCallsResponse {
  items: AnalyticsCallItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AnalyticsCompareDayData {
  totalCalls: number;
  completedCalls: number;
  averageResponseTimeSec: number;
}

export interface AnalyticsCompareResponse {
  today: AnalyticsCompareDayData;
  previousDay: AnalyticsCompareDayData;
  comparison: {
    callsDiffPercent: number;
    responseTimeDiffPercent: number;
  };
}

// ============================================================================
// 10. NOTIFICAÇÕES (/restaurant/notifications/*)
// ============================================================================

export interface NotificationSettingsDto {
  restaurantId: string;
  emailSummaryEnabled: boolean;
  summaryEmailRecipient: string | null;
  urgentAlertEnabled: boolean;
  urgentAlertRecipient: string | null;
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
// 11. ADMIN (/admin/*)
// ============================================================================

export interface AdminRestaurantItem {
  id: string;
  name: string;
  status: RestaurantStatus;
  tablesCount: number;
  usersCount: number;
  createdAt: string;
  ownerUsername?: string;
}

export interface AdminRestaurantsResponse {
  items: AdminRestaurantItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateRestaurantRequest {
  name: string;
  ownerUsername: string;
}

export interface CreateRestaurantResponse {
  id: string;
  name: string;
  ownerUsername: string;
  temporaryPassword?: string;
}

export interface ResetOwnerPasswordResponse {
  temporaryPassword: string;
}

export interface ImpersonateResponse {
  accessToken: string;
  restaurantId: string;
  restaurantName: string;
  ownerId?: string;
  ownerUsername?: string;
  impersonatedBy?: string;
}

export interface AdminAuditLogItem {
  id: string;
  timestamp: string;
  actorUserId: string;
  actorRole: Role;
  action: string;
  restaurantId: string | null;
  meta: Record<string, unknown> | null;
}

export interface AdminAuditResponse {
  items: AdminAuditLogItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ============================================================================
// 12. MAPA DE EVENTOS EM TEMPO REAL (SSE EVENT MAP)
// Suporte a formatos oficial (UPPERCASE) e backend runtime (dot lowercase)
// ============================================================================

export interface RealtimeEventMap {
  snapshot: PanelStateDto;
  CALL_CREATED: {
    callId: string;
    restaurantId: string;
    tableId: string;
    tableNumber: number;
    type: CallType;
    status: CallStatus;
    createdAt: string;
    note?: string | null;
  };
  "call.opened": {
    callId: string;
    restaurantId: string;
    tableId: string;
    tableNumber?: number;
    type: CallType;
    status: CallStatus;
    createdAt: string;
    note?: string | null;
  };
  CALL_ACKNOWLEDGED: {
    callId: string;
    actorUserId: string;
    acknowledgedAt: string;
  };
  "call.acknowledged": {
    callId: string;
    actorUserId: string;
    occurredAt: string;
  };
  CALL_ASSUMED: {
    callId: string;
    actorUserId: string;
    acknowledgedAt: string;
  };
  CALL_ATTENDED: {
    callId: string;
    actorUserId: string;
    attendedAt: string;
  };
  "call.attended": {
    callId: string;
    actorUserId: string;
    occurredAt: string;
  };
  CALL_CONFIRMED: {
    callId: string;
    rating?: number | null;
    confirmedAt: string;
  };
  "call.confirmed": {
    callId: string;
    rating?: number | null;
    occurredAt: string;
  };
  CALL_REOPENED: {
    callId: string;
    reopenCount: number;
    reopenedAt: string;
  };
  "call.reopened": {
    callId: string;
    reopenCount: number;
    occurredAt: string;
  };
  CALL_CANCELLED: {
    callId: string;
    cancelledAt: string;
  };
  "call.cancelled": {
    callId: string;
    occurredAt: string;
  };
  CALL_EXPIRED: {
    callId: string;
    expiredAt: string;
  };
  "call.expired": {
    callId: string;
    occurredAt: string;
  };
  CALL_CLOSED_UNCONFIRMED: {
    callId: string;
    closedAt: string;
  };
  "call.closed": {
    callId: string;
    occurredAt: string;
  };
  TABLE_PAUSED: {
    tableId: string;
    tableNumber: number;
  };
  TABLE_RESUMED: {
    tableId: string;
    tableNumber: number;
  };
  TABLE_DELETED: {
    tableId: string;
  };
  "table.removed": {
    tableId: string;
    tableNumber?: number;
    message?: string;
  };
  "alert.raised": {
    restaurantId: string;
    tableNumber: number;
    callType: CallType;
    waitDurationSec: number;
    urgentThresholdSec: number;
    note?: string | null;
    raisedAt: string;
  };
}
