import dayjs from "dayjs";
import "dayjs/locale/vi";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import relativeTime from "dayjs/plugin/relativeTime";

// Extend dayjs with plugins
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// Set default locale to Vietnamese
dayjs.locale("vi");

export const formatCurrency = (val: number | string | null | undefined) => {
  const amount = typeof val === "string" ? parseFloat(val) : Number(val || 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("DD/MM/YYYY HH:mm");
};

/**
 * If the string looks like a JSON object (e.g. {"color":"Black","size":"S"}),
 * parse and format as human-readable "value1 - value2". Otherwise return as-is.
 */
export function formatVariantDisplayName(str: string | null | undefined): string {
  if (str == null || typeof str !== "string") return str ?? "";
  const trimmed = str.trim();
  if (!trimmed.startsWith("{")) return str;
  try {
    const obj = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof obj !== "object" || obj === null) return str;
    const values = Object.values(obj).filter((v) => v != null && String(v).trim() !== "");
    return values.length > 0 ? values.map(String).join(" - ") : str;
  } catch {
    return str;
  }
}

export const formatDateShort = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("DD/MM/YYYY");
};

// Additional dayjs utilities
export const formatDateTime = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("HH:mm:ss DD/MM/YYYY");
};

export const formatTime = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).format("HH:mm");
};

export const formatRelativeTime = (dateString: string | Date | null | undefined) => {
  if (!dateString) return "N/A";
  return dayjs(dateString).fromNow();
};

export const isToday = (dateString: string | Date) => {
  return dayjs(dateString).isSame(dayjs(), "day");
};

export const isYesterday = (dateString: string | Date) => {
  return dayjs(dateString).isSame(dayjs().subtract(1, "day"), "day");
};

export const getCurrentMonth = () => {
  return dayjs().month() + 1; // dayjs month is 0-indexed
};

export const getCurrentYear = () => {
  return dayjs().year();
};

export const startOfMonth = (date?: string | Date) => {
  return dayjs(date).startOf("month").toDate();
};

export const endOfMonth = (date?: string | Date) => {
  return dayjs(date).endOf("month").toDate();
};

export const addDays = (date: string | Date, days: number) => {
  return dayjs(date).add(days, "day").toDate();
};

export const subtractDays = (date: string | Date, days: number) => {
  return dayjs(date).subtract(days, "day").toDate();
};

// Re-export dayjs for advanced usage
export { dayjs };

/** Resolve admin breadcrumb label for a path segment. */
export function getBreadcrumbName(segment: string, routeNames: Record<string, string>): string {
  if (routeNames[segment]) {
    return routeNames[segment];
  }
  if (segment.length > 20 || /^\d+$/.test(segment)) {
    return "Chi tiết";
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}
