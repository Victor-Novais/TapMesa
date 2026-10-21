/**
 * Utilitários para cálculo do dia operacional e formatação de datas e tempos (RF-R01 a R10).
 */

export type DatePreset = "today" | "yesterday" | "7d" | "30d" | "custom";

export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

/**
 * Retorna a data no formato YYYY-MM-DD para um dado Date no fuso horário do restaurante.
 */
function formatDateToYMD(date: Date, timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(date);
  } catch {
    // Fallback ISO
    return date.toISOString().split("T")[0]!;
  }
}

/**
 * Retorna a hora atual (0..23) no fuso horário especificado.
 */
function getHourInTimezone(date: Date, timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour");
    return hourPart ? parseInt(hourPart.value, 10) : date.getHours();
  } catch {
    return date.getHours();
  }
}

/**
 * Calcula o dia operacional atual com base no fuso e no horário de corte (dayCutoffHour).
 * Exemplo: se o corte é 05:00 e o horário atual é 02:30 de 21/10, o dia operacional ainda é 20/10.
 */
export function getOperationalDateString(
  date: Date = new Date(),
  timezone = "America/Sao_Paulo",
  dayCutoffHour = 5,
): string {
  const currentHour = getHourInTimezone(date, timezone);
  const targetDate = new Date(date);

  // Se a hora atual for menor que o horário de corte, subtrai 1 dia
  if (currentHour < dayCutoffHour) {
    targetDate.setDate(targetDate.getDate() - 1);
  }

  return formatDateToYMD(targetDate, timezone);
}

/**
 * Retorna os intervalos padrão (Presets) para o filtro de período.
 */
export function getDatePresets(
  timezone = "America/Sao_Paulo",
  dayCutoffHour = 5,
): Record<Exclude<DatePreset, "custom">, DateRange> {
  const todayYMD = getOperationalDateString(
    new Date(),
    timezone,
    dayCutoffHour,
  );

  // Parse today parts
  const [year, month, day] = todayYMD.split("-").map(Number);
  const baseDate = new Date(Date.UTC(year!, month! - 1, day!));

  // Ontem
  const yesterdayDate = new Date(baseDate);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterdayYMD = yesterdayDate.toISOString().split("T")[0]!;

  // 7 dias
  const sevenDaysDate = new Date(baseDate);
  sevenDaysDate.setUTCDate(sevenDaysDate.getUTCDate() - 6);
  const sevenDaysYMD = sevenDaysDate.toISOString().split("T")[0]!;

  // 30 dias
  const thirtyDaysDate = new Date(baseDate);
  thirtyDaysDate.setUTCDate(thirtyDaysDate.getUTCDate() - 29);
  const thirtyDaysYMD = thirtyDaysDate.toISOString().split("T")[0]!;

  return {
    today: { from: todayYMD, to: todayYMD },
    yesterday: { from: yesterdayYMD, to: yesterdayYMD },
    "7d": { from: sevenDaysYMD, to: todayYMD },
    "30d": { from: thirtyDaysYMD, to: todayYMD },
  };
}

/**
 * Verifica se um determinado intervalo inclui o dia operacional de hoje.
 */
export function isTodayIncluded(
  from: string,
  to: string,
  timezone = "America/Sao_Paulo",
  dayCutoffHour = 5,
): boolean {
  const todayYMD = getOperationalDateString(
    new Date(),
    timezone,
    dayCutoffHour,
  );
  return todayYMD >= from && todayYMD <= to;
}

/**
 * Formata segundos em formato legível mm:ss ou s.
 */
export function formatDurationSec(seconds: number | null | undefined): string {
  if (
    seconds === null ||
    seconds === undefined ||
    isNaN(seconds) ||
    seconds < 0
  ) {
    return "--:--";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
