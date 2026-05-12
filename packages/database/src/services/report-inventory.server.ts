/**
 * Inventory Reports — barrel re-export.
 *
 * 5.1 current-stock | 5.2 ledger | 5.3 in-out-movement | 5.4 low-stock
 */

export {
  getCurrentStockReport,
  getCategoryStockBreakdown,
  getVariantRecentMovements,
  searchVariants,
  getVariantById,
  type CurrentStockRow,
  type CurrentStockKpi,
  type CurrentStockReport,
  type CategoryStockRow,
  type CurrentStockParams,
} from "./report-inventory-current.server";

export {
  getLedgerReport,
  type LedgerRow,
  type LedgerKpi,
  type LedgerReport,
  type LedgerParams,
} from "./report-inventory-ledger.server";

export {
  getInOutMovementReport,
  getVariantMovementsInPeriod,
  type InOutMovementRow,
  type InOutMovementKpi,
  type InOutMovementReport,
  type MovementDrillRow,
  type InOutMovementParams,
} from "./report-inventory-movement.server";

export {
  getLowStockReport,
  type LowStockRow,
  type LowStockKpi,
  type LowStockReport,
  type LowStockParams,
} from "./report-inventory-low-stock.server";
