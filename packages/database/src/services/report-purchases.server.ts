/**
 * Báo cáo Nhập hàng (Purchases Reports) — barrel re-export.
 *
 * 5 reports: by-time / by-supplier / by-product / by-staff / payouts-by-method.
 * All derived from goods_receipts (status='completed', cancelled_at IS NULL)
 * and supplier_payments. No schema changes.
 *
 * Import from: `@workspace/database/services/report-purchases.server`
 */

export {
  getPurchasesByTimeReport,
  type PurchasesByTimePeriodRow,
  type PurchasesByTimeReport,
} from "./report-purchases-by-time.server";

export {
  getPurchasesBySupplierReport,
  getPurchasesSupplierReceipts,
  type PurchasesBySupplierReport,
  type PurchasesBySupplierRow,
  type SupplierReceiptRow,
} from "./report-purchases-by-supplier.server";

export {
  getPurchasesByProductReport,
  getPurchasesProductReceipts,
  type ProductReceiptRow,
  type PurchasesByProductReport,
  type PurchasesByProductRow,
} from "./report-purchases-by-product.server";

export {
  getPurchasesByStaffReport,
  getPurchasesStaffReceipts,
  getPurchasesUnknownStaffReceipts,
  type PurchasesByStaffReport,
  type PurchasesByStaffRow,
  type StaffReceiptRow,
} from "./report-purchases-by-staff.server";

export {
  getPayoutsByMethodReport,
  getPayoutTransactionsByMethod,
  type PayoutsByMethodReport,
  type PayoutsByMethodRow,
  type PayoutTransactionRow,
} from "./report-purchases-payouts.server";
