/**
 * Client-side data fetchers for Purchases Reports (phase 04).
 * Separate from reports.client.ts (financial) to stay under 200 LOC.
 */

import { axios } from "@workspace/shared/api-client";

// ── Types ──────────────────────────────────────────────────────────────────

export type PurchasesByTimePeriodRow = {
  period: string;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
};

export type PurchasesByTimeReport = {
  rows: PurchasesByTimePeriodRow[];
  summary: {
    totalReceipts: number;
    totalQty: number;
    totalPayable: number;
    totalPaid: number;
    totalDebt: number;
  };
  groupBy: "day" | "week" | "month";
};

export type PurchasesBySupplierRow = {
  supplierId: string | null;
  supplierName: string | null;
  supplierCode: string | null;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
  avgPerReceipt: number;
};

export type PurchasesBySupplierReport = {
  data: PurchasesBySupplierRow[];
  summary: {
    supplierCount: number;
    totalReceipts: number;
    totalPayable: number;
    topSupplierName: string | null;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type PurchasesByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  totalQty: number;
  lineTotal: number;
  avgUnitCost: number;
  currentCostPrice: number;
};

export type PurchasesByProductReport = {
  data: PurchasesByProductRow[];
  summary: {
    skuCount: number;
    totalQty: number;
    totalValue: number;
    avgCost: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type PurchasesByStaffRow = {
  staffId: string | null;
  staffName: string;
  receiptCount: number;
  totalQty: number;
  payableAmount: number;
  paidAmount: number;
  debtAmount: number;
  avgPerReceipt: number;
};

export type PurchasesByStaffReport = {
  data: PurchasesByStaffRow[];
  summary: {
    staffCount: number;
    totalReceipts: number;
    totalPayable: number;
    topStaffName: string | null;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type PayoutsByMethodRow = {
  method: string;
  txCount: number;
  totalAmount: number;
  pct: number;
  avgAmount: number;
};

export type PayoutsByMethodReport = {
  rows: PayoutsByMethodRow[];
  summary: {
    totalAmount: number;
    txCount: number;
    avgAmount: number;
    topMethod: string | null;
  };
};

export type ReceiptDrilldownRow = {
  id: string;
  code: string;
  createdAt: string;
  payableAmount?: number;
  paidAmount?: number;
  debtAmount?: number;
  supplierName?: string | null;
  quantity?: number;
  unitCost?: number;
  lineTotal?: number;
};

export type PayoutTxRow = {
  id: string;
  code: string;
  supplierName: string | null;
  method: string;
  amount: number;
  paidAt: string;
  note: string | null;
};

type DateRange = { startDate: string; endDate: string };

// ── Client ─────────────────────────────────────────────────────────────────

export const purchasesReportsClient = {
  async getByTime(params: DateRange & { groupBy?: "day" | "week" | "month" }) {
    return axios.get<PurchasesByTimeReport>("/api/admin/reports/purchases/by-time", {
      params,
    }) as unknown as Promise<PurchasesByTimeReport>;
  },

  async getBySupplier(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<PurchasesBySupplierReport>("/api/admin/reports/purchases/by-supplier", {
      params,
    }) as unknown as Promise<PurchasesBySupplierReport>;
  },

  async getByProduct(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<PurchasesByProductReport>("/api/admin/reports/purchases/by-product", {
      params,
    }) as unknown as Promise<PurchasesByProductReport>;
  },

  async getByStaff(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<PurchasesByStaffReport>("/api/admin/reports/purchases/by-staff", {
      params,
    }) as unknown as Promise<PurchasesByStaffReport>;
  },

  async getPayoutsByMethod(params: DateRange) {
    return axios.get<PayoutsByMethodReport>("/api/admin/reports/purchases/payouts-by-method", {
      params,
    }) as unknown as Promise<PayoutsByMethodReport>;
  },

  async getSupplierReceipts(params: DateRange & { supplierId: string }) {
    return axios.get<{ data: ReceiptDrilldownRow[] }>(
      "/api/admin/reports/purchases/by-supplier/receipts",
      { params },
    ) as unknown as Promise<{ data: ReceiptDrilldownRow[] }>;
  },

  async getProductReceipts(params: DateRange & { variantId: string }) {
    return axios.get<{ data: ReceiptDrilldownRow[] }>(
      "/api/admin/reports/purchases/by-product/receipts",
      { params },
    ) as unknown as Promise<{ data: ReceiptDrilldownRow[] }>;
  },

  async getStaffReceipts(params: DateRange & { staffId: string }) {
    return axios.get<{ data: ReceiptDrilldownRow[] }>(
      "/api/admin/reports/purchases/by-staff/receipts",
      { params },
    ) as unknown as Promise<{ data: ReceiptDrilldownRow[] }>;
  },

  async getPayoutTransactions(params: DateRange & { method: string }) {
    return axios.get<{ data: PayoutTxRow[] }>(
      "/api/admin/reports/purchases/payouts-by-method/transactions",
      { params },
    ) as unknown as Promise<{ data: PayoutTxRow[] }>;
  },
};

// ── Export URL builder ─────────────────────────────────────────────────────

type PurchasesExportReport =
  | "by-time"
  | "by-supplier"
  | "by-product"
  | "by-staff"
  | "payouts-by-method";

export function buildPurchasesExportUrl(
  report: PurchasesExportReport,
  params: DateRange & {
    format: "csv" | "xlsx";
    groupBy?: "day" | "week" | "month";
    search?: string;
  },
): string {
  const q = new URLSearchParams();
  q.set("startDate", params.startDate);
  q.set("endDate", params.endDate);
  q.set("format", params.format);
  if (params.groupBy) q.set("groupBy", params.groupBy);
  if (params.search) q.set("search", params.search);
  return `/api/admin/reports/purchases/${report}/export?${q.toString()}`;
}
