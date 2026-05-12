/** VN display labels for purchases reports — mirrors pattern of report-formatters.ts. */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
  unknown: "Không rõ",
};

export function fmtPaymentMethod(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

export const GROUP_BY_LABELS: Record<"day" | "week" | "month", string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng",
};
