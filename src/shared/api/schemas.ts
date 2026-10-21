import { z } from "zod";

// ============================================================================
// TOLERANT SCHEMAS (ZOD) PARA VALIDAÇÃO RESILIENTE DE RESPOSTAS CRÍTICAS
// ============================================================================

export const publicCallSchema = z
  .object({
    id: z.string(),
    type: z.enum(["WAITER", "BILL"]),
    status: z.enum([
      "PENDING",
      "ATTENDED",
      "CONFIRMED",
      "CLOSED_UNCONFIRMED",
      "CANCELLED",
      "EXPIRED",
    ]),
    note: z.string().nullable().optional(),
    createdAt: z.string(),
    attendedAt: z.string().nullable().optional(),
    acknowledgedAt: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    confirmationDeadline: z.string().nullable().optional(),
    reopenCount: z.number().default(0),
    alreadyPending: z.boolean().optional(),
    serverNow: z.string().optional(),
  })
  .passthrough();

export const publicTableSchema = z
  .object({
    tableNumber: z.number(),
    available: z.boolean().default(true),
    unavailableReason: z
      .enum(["TABLE_PAUSED", "RESTAURANT_SUSPENDED"])
      .nullable()
      .optional(),
    message: z.string().nullable().optional(),
    showWaitTimeToCustomer: z.boolean().default(false),
    serverNow: z.string(),
    appearance: z
      .object({
        restaurantName: z.string().default("TapMesa"),
        description: z.string().nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        backgroundType: z.string().default("color"),
        backgroundValue: z.string().nullable().optional(),
        colors: z.record(z.string(), z.string()).default({}),
        texts: z.record(z.string(), z.string()).default({}),
        socials: z.record(z.string(), z.string().nullable()).default({}),
      })
      .passthrough(),
    calls: z.array(publicCallSchema).default([]),
  })
  .passthrough();

export const panelCallSchema = z
  .object({
    id: z.string(),
    tableNumber: z.number(),
    type: z.enum(["WAITER", "BILL"]),
    status: z.enum([
      "PENDING",
      "ATTENDED",
      "CONFIRMED",
      "CLOSED_UNCONFIRMED",
      "CANCELLED",
      "EXPIRED",
    ]),
    note: z.string().nullable().optional(),
    createdAt: z.string(),
    acknowledgedAt: z.string().nullable().optional(),
    acknowledgedById: z.string().nullable().optional(),
    firstAttendedAt: z.string().nullable().optional(),
    attendedAt: z.string().nullable().optional(),
    attendedById: z.string().nullable().optional(),
    rating: z.number().nullable().optional(),
    reopenCount: z.number().default(0),
    reactionTimeSec: z.number().nullable().optional(),
    executionTimeSec: z.number().nullable().optional(),
    serverNow: z.string().optional(),
  })
  .passthrough();

export const panelStateSchema = z
  .object({
    calls: z.array(panelCallSchema).default([]),
    alertSec: z.number().default(180),
    urgentSec: z.number().default(300),
    activeCallsCount: z.number().default(0),
    waiterCallsCount: z.number().default(0),
    billCallsCount: z.number().default(0),
    serverNow: z.string(),
  })
  .passthrough();

/**
 * Validação segura e tolerante que não quebra a interface em divergências secundárias.
 */
export function validateTolerant<T>(
  schema: z.ZodType<T>,
  data: unknown,
  contextName: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (process.env.NODE_ENV !== "production") {
      // Registrar em desenvolvimento sem crashar
      console.warn(
        `[Zod Tolerant Validation Warning] Divergência detectada em ${contextName}:`,
        result.error.issues,
      );
    }
    return data as T;
  }
  return result.data;
}
