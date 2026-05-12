/**
 * Sales Reports — barrel re-export.
 *
 * All 8 sales report functions live in dedicated per-report files (<200 LOC each).
 * Import from here: `@workspace/database/services/report-sales.server`
 */

export {
  getSalesByTimeReport,
  type SalesByTimeReport,
  type SalesByTimeRow,
} from "./report-sales-by-time.server";

export {
  getSalesByStaffReport,
  type SalesByStaffReport,
  type SalesByStaffRow,
} from "./report-sales-by-staff.server";

export {
  getSalesByProductReport,
  type SalesByProductReport,
  type SalesByProductRow,
} from "./report-sales-by-product.server";

export {
  getSalesByCustomerReport,
  type SalesByCustomerReport,
  type SalesByCustomerRow,
} from "./report-sales-by-customer.server";

export {
  getSalesByOrderReport,
  type SalesByOrderReport,
  type SalesByOrderRow,
} from "./report-sales-by-order.server";

export {
  getPaymentsByMethodReport,
  type PaymentsByMethodReport,
  type PaymentsByMethodRow,
} from "./report-sales-payments-by-method.server";

export {
  getPaymentsByStaffReport,
  type PaymentsByStaffReport,
  type PaymentsByStaffRow,
} from "./report-sales-payments-by-staff.server";

export {
  getPaymentsByTimeReport,
  type PaymentsByTimeReport,
  type PaymentsByTimeRow,
} from "./report-sales-payments-by-time.server";
