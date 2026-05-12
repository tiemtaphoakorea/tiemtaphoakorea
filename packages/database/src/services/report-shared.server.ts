/**
 * Shared helpers for all report services (financial + sales + purchases + inventory + customers).
 *
 * Includes period normalization, period-over-period helpers, percent-change calc, raw-row
 * extraction from postgres driver responses, and the date_trunc / to_char format map used
 * by time-series reports.
 */

export function normalizeRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** Same-length immediately preceding period. e.g. [2026-04-01, 2026-04-30] → [2026-03-02, 2026-03-31] */
export function previousPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);
  prevStart.setHours(0, 0, 0, 0);
  prevEnd.setHours(23, 59, 59, 999);
  return { start: prevStart, end: prevEnd };
}

export function deltaPct(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Postgres driver returns either an array of rows or `{ rows: [...] }` depending on
 * whether the query was issued via `db.execute(sql\`...\`)` or query-builder. Normalize.
 */
export function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: T[] }).rows;
  }
  return [];
}

/** date_trunc unit + to_char format pairs for day/week/month grouping. */
export const TRUNC_FMT: Record<"day" | "week" | "month", { trunc: string; format: string }> = {
  day: { trunc: "day", format: "YYYY-MM-DD" },
  week: { trunc: "week", format: 'IYYY-"W"IW' },
  month: { trunc: "month", format: "YYYY-MM" },
};
