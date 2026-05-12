/** Column labels and display constants for sales reports. */

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  card: "Thẻ",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Chưa thanh toán",
  partial: "Thanh toán một phần",
  paid: "Đã thanh toán",
};

export const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xử lý",
  stock_out: "Đã xuất kho",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const GROUP_BY_LABELS: Record<"day" | "week" | "month", string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng",
};

export const SALES_REPORT_TITLES: Record<string, string> = {
  "by-time": "Doanh thu theo thời gian",
  "by-staff": "Doanh thu theo nhân viên",
  "by-product": "Doanh thu theo sản phẩm",
  "by-customer": "Doanh thu theo khách hàng",
  "by-order": "Chi tiết đơn hàng",
  "payments-by-method": "Thu tiền theo phương thức",
  "payments-by-staff": "Thu tiền theo nhân viên",
  "payments-by-time": "Thu tiền theo thời gian",
};
