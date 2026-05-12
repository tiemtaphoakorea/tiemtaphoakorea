/**
 * Client-side API helpers for inventory reports (5.1–5.4).
 * Mirrors server response types to decouple React Query layer from db internals.
 */

import { axios } from "@workspace/shared/api-client";

// ── 5.1 Current Stock ──────────────────────────────────────────────────────

export type CurrentStockRow = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryId: string | null;
  categoryName: string | null;
  onHand: number;
  reserved: number;
  available: number;
  costPrice: number;
  stockValue: number;
  lowStockThreshold: number;
  stockStatus: "in-stock" | "low" | "out-of-stock";
};

export type CurrentStockKpi = {
  totalSkus: number;
  totalUnits: number;
  totalValue: number;
  lowStockSkus: number;
};

export type CurrentStockReport = {
  data: CurrentStockRow[];
  kpi: CurrentStockKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type CategoryStockRow = {
  categoryId: string | null;
  categoryName: string;
  skuCount: number;
  totalUnits: number;
  totalValue: number;
  pctOfTotal: number;
};

// ── 5.2 Ledger ────────────────────────────────────────────────────────────

export type LedgerRow = {
  id: string;
  createdAt: string;
  type: string;
  quantity: number;
  qtyIn: number;
  qtyOut: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  referenceRoute: string | null;
  note: string | null;
  estimatedUnitCost: number;
  estimatedValue: number;
};

export type LedgerKpi = {
  openingBalance: number;
  totalQtyIn: number;
  totalQtyOut: number;
  closingBalance: number;
  estimatedValueIn: number;
};

export type LedgerReport = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  currentOnHand: number;
  costPrice: number;
  data: LedgerRow[];
  kpi: LedgerKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

// ── 5.3 In-Out Movement ───────────────────────────────────────────────────

export type InOutMovementRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  opening: number;
  qtyIn: number;
  qtyOut: number;
  qtyAdjust: number;
  closing: number;
};

export type InOutMovementKpi = {
  totalQtyIn: number;
  totalQtyOut: number;
  totalQtyAdjust: number;
  variantsWithMovement: number;
};

export type InOutMovementReport = {
  data: InOutMovementRow[];
  kpi: InOutMovementKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type MovementDrillRow = {
  id: string;
  createdAt: string;
  type: string;
  quantity: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  note: string | null;
};

// ── 5.4 Low Stock ─────────────────────────────────────────────────────────

export type LowStockRow = {
  id: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryName: string | null;
  onHand: number;
  lowStockThreshold: number;
  status: "out-of-stock" | "low";
  costPrice: number;
};

export type LowStockKpi = {
  lowStockSkus: number;
  outOfStockSkus: number;
  totalRemainingUnits: number;
};

export type LowStockReport = {
  data: LowStockRow[];
  kpi: LowStockKpi;
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

// ── Variant search (for ledger picker) ───────────────────────────────────

export type VariantSearchRow = {
  id: string;
  sku: string;
  variantName: string;
  productName: string;
  onHand: number;
};

// ── API client ────────────────────────────────────────────────────────────

type DateRange = { startDate: string; endDate: string };

export const inventoryReportsClient = {
  async getCurrentStock(params: {
    search?: string;
    categoryId?: string;
    stockStatus?: "all" | "in-stock" | "out-of-stock" | "low";
    sortBy?: "value" | "qty";
    sortDir?: "asc" | "desc";
    page?: number;
    limit?: number;
  }) {
    return axios.get<CurrentStockReport>("/api/admin/reports/inventory/current-stock", {
      params,
    }) as unknown as Promise<CurrentStockReport>;
  },

  async getCategoryBreakdown() {
    return axios.get<{ data: CategoryStockRow[] }>("/api/admin/reports/inventory/current-stock", {
      params: { view: "category" },
    }) as unknown as Promise<{ data: CategoryStockRow[] }>;
  },

  async getLedger(
    params: DateRange & {
      variantId: string;
      typeFilter?: "in" | "out" | "adjust" | "all";
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<LedgerReport>("/api/admin/reports/inventory/ledger", {
      params,
    }) as unknown as Promise<LedgerReport>;
  },

  async getInOutMovement(
    params: DateRange & {
      search?: string;
      typeFilter?: "in" | "out" | "adjust" | "all";
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<InOutMovementReport>("/api/admin/reports/inventory/in-out-movement", {
      params,
    }) as unknown as Promise<InOutMovementReport>;
  },

  async getMovementDrill(params: DateRange & { variantId: string }) {
    return axios.get<{ data: MovementDrillRow[] }>("/api/admin/reports/inventory/in-out-movement", {
      params: { ...params, view: "drill" },
    }) as unknown as Promise<{ data: MovementDrillRow[] }>;
  },

  async getLowStock(params: {
    search?: string;
    categoryId?: string;
    status?: "all" | "low" | "out";
    page?: number;
    limit?: number;
  }) {
    return axios.get<LowStockReport>("/api/admin/reports/inventory/low-stock", {
      params,
    }) as unknown as Promise<LowStockReport>;
  },

  async searchVariants(search: string) {
    return axios.get<{ data: VariantSearchRow[] }>("/api/admin/reports/inventory/current-stock", {
      params: { view: "variants", search },
    }) as unknown as Promise<{ data: VariantSearchRow[] }>;
  },
};

/** Build export download URL for inventory reports. */
export function buildInventoryExportUrl(
  report: "current-stock" | "ledger" | "in-out-movement" | "low-stock",
  params: Record<string, string | number | boolean | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") q.set(k, String(v));
  }
  return `/api/admin/reports/inventory/${report}/export?${q.toString()}`;
}
