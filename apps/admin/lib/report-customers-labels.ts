/** Display labels for customer reports — used in UI and export formatters. */

export const CUSTOMER_SEGMENT_LABELS: Record<string, string> = {
  new: "Khách mới",
  returning: "Khách quay lại",
};

export const CUSTOMER_SORT_LABELS: Record<string, string> = {
  revenue: "Doanh thu",
  order_count: "Số đơn hàng",
  customer_count: "Số khách hàng",
  qty: "Số lượng bán",
};

export const CUSTOMER_BY_PRODUCT_SORT_OPTIONS = [
  { value: "customer_count", label: "Số khách hàng" },
  { value: "revenue", label: "Doanh thu" },
  { value: "qty", label: "Số lượng bán" },
] as const;
