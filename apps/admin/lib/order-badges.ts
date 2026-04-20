import type { FulfillmentStatusValue, PaymentStatusValue } from "@workspace/shared/constants";

export const PAYMENT_BADGE: Record<PaymentStatusValue, { label: string; className: string }> = {
  unpaid: { label: "Chưa thanh toán", className: "bg-red-100 text-red-800" },
  partial: { label: "Thanh toán một phần", className: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
};

export const FULFILLMENT_BADGE: Record<
  FulfillmentStatusValue,
  { label: string; className: string }
> = {
  pending: { label: "Chờ xử lý", className: "bg-gray-100 text-gray-800" },
  stock_out: { label: "Đã xuất kho", className: "bg-blue-100 text-blue-800" },
  completed: { label: "Hoàn tất", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Đã hủy", className: "bg-gray-300 text-gray-600" },
};
