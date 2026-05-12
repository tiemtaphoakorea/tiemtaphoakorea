/** VN currency formatter shared across report exports. */
export function fmtVnd(n: number | null | undefined): string {
  return new Intl.NumberFormat("vi-VN").format(Number(n ?? 0));
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN");
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN");
}

export function fmtPercent(n: number | null | undefined, digits = 1): string {
  return `${Number(n ?? 0).toFixed(digits)}%`;
}

export const PNL_METRIC_LABELS = {
  salesRevenue: "Doanh thu bán hàng",
  cogs: "Giá vốn hàng bán",
  grossProfit: "Lợi nhuận gộp",
  otherIncome: "Thu nhập khác",
  otherExpense: "Chi phí khác",
  netProfit: "Lợi nhuận ròng",
  orderCount: "Số đơn hàng đã tính P&L",
  missingCostItems: "Dòng thiếu giá vốn",
  missingCostOrderCount: "Đơn thiếu giá vốn",
  missingCostRate: "Tỷ lệ dòng thiếu giá vốn",
  excludedRevenue: "Doanh thu chưa tính vào P&L",
} as const;

const PNL_COUNT_METRICS = new Set(["orderCount", "missingCostItems", "missingCostOrderCount"]);
const PNL_RATE_METRICS = new Set(["missingCostRate"]);

export function formatPnlMetricValue(key: string, value: number | null | undefined): string {
  if (PNL_COUNT_METRICS.has(key)) {
    return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value ?? 0));
  }
  if (PNL_RATE_METRICS.has(key)) {
    return fmtPercent(Number(value ?? 0) * 100);
  }
  return fmtVnd(value);
}
