/**
 * Vietnamese labels for inventory movement types.
 * Kept separate from report-formatters.ts (owned by other phases).
 */

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  supplier_receipt: "Nhập hàng",
  stock_out: "Xuất bán",
  manual_adjustment: "Điều chỉnh thủ công",
  cancellation: "Huỷ đơn",
  stock_count_balance: "Kiểm kê",
  cost_adjustment: "Điều chỉnh giá vốn",
};

export const MOVEMENT_TYPE_BUCKET_LABELS: Record<string, string> = {
  in: "Nhập",
  out: "Xuất",
  adjust: "Điều chỉnh",
};

export const STOCK_STATUS_LABELS: Record<string, string> = {
  "in-stock": "Còn hàng",
  low: "Sắp hết",
  "out-of-stock": "Hết hàng",
};

export function getMovementTypeLabel(type: string): string {
  return MOVEMENT_TYPE_LABELS[type] ?? type;
}

export function getStockStatusLabel(status: string): string {
  return STOCK_STATUS_LABELS[status] ?? status;
}
