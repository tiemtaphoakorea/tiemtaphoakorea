/**
 * Báo cáo Tài chính (Financial Reports) — barrel re-export.
 *
 * Internal split per Sapo report (each <200 LOC). Public surface unchanged so existing
 * callers (`apps/admin/app/api/admin/reports/{profit-loss,customer-debts,supplier-debts,cash-flow}/...`)
 * keep importing from `@workspace/database/services/report.server`.
 *
 * Sales / Purchases / Inventory / Customers reports live in their own `report-{group}.server.ts`
 * barrels (added in phases 03-06).
 */

export {
  type CashFlowPeriodRow,
  type CashFlowReport,
  type CashFlowTransaction,
  getCashFlowReport,
  getCashFlowTransactions,
} from "./report-financial-cash-flow.server";

export {
  type CustomerDebtRow,
  type CustomerDebtsReport,
  type DebtTransaction,
  getCustomerDebtsReport,
  getCustomerDebtTransactions,
} from "./report-financial-customer-debts.server";
export {
  getProfitByOrderReport,
  type ProfitByOrderItem,
  type ProfitByOrderReport,
  type ProfitByOrderRow,
  type ProfitByOrderSort,
} from "./report-financial-profit-by-order.server";
export {
  getMissingCostOrdersReport,
  getProfitLossReport,
  type MissingCostOrderItem,
  type MissingCostOrderRow,
  type MissingCostOrdersReport,
  type PnLMetrics,
  type ProfitLossReport,
} from "./report-financial-profit-loss.server";

export {
  getSupplierDebtsReport,
  getSupplierDebtTransactions,
  type SupplierDebtRow,
  type SupplierDebtsReport,
  type SupplierDebtTransaction,
} from "./report-financial-supplier-debts.server";
