/**
 * Sales reports client — types + fetch wrappers for all 8 sales reports.
 * Separate file from reports.client.ts (financial only) to keep each <200 LOC.
 */

import { axios } from "@workspace/shared/api-client";

// ── Shared ──────────────────────────────────────────────────────────────────

type DateRange = { startDate: string; endDate: string };

// ── Types ────────────────────────────────────────────────────────────────────

export type SalesByTimeRow = {
  period: string;
  orderCount: number;
  revenue: number;
  cogs: number;
  profit: number;
  profitPct: number;
};

export type SalesByTimeReport = {
  data: SalesByTimeRow[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrderCount: number;
    aov: number;
    grossMarginPct: number;
  };
  compare: {
    totalRevenue: number | null;
    delta: { revenue: number | null; profit: number | null; orderCount: number | null };
  } | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  groupBy: "day" | "week" | "month";
};

export type SalesByStaffRow = {
  staffId: string | null;
  staffName: string;
  orderCount: number;
  revenue: number;
  profit: number;
  profitPct: number;
  aov: number;
};

export type SalesByStaffReport = {
  data: SalesByStaffRow[];
  summary: {
    totalRevenue: number;
    totalProfit: number;
    totalOrderCount: number;
    staffCount: number;
    topStaffName: string | null;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type SalesByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  qty: number;
  revenue: number;
  cogs: number;
  profit: number;
  profitPct: number;
};

export type SalesByProductReport = {
  data: SalesByProductRow[];
  summary: { totalSkus: number; totalQty: number; totalRevenue: number; totalProfit: number };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type SalesByCustomerRow = {
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
  profit: number;
  profitPct: number;
  aov: number;
  lastOrderAt: string | null;
};

export type SalesByCustomerReport = {
  data: SalesByCustomerRow[];
  summary: {
    customerCount: number;
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    topCustomerName: string | null;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type SalesByOrderRow = {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerName: string;
  staffName: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  revenue: number;
  paidAmount: number;
  debtAmount: number;
  profit: number;
};

export type SalesByOrderReport = {
  data: SalesByOrderRow[];
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalPaid: number;
    totalDebt: number;
    totalProfit: number;
    paymentStatusBreakdown: Record<string, number>;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type PaymentsByMethodRow = {
  method: string;
  txCount: number;
  total: number;
  pct: number;
  avgPerTx: number;
};
export type PaymentsByMethodReport = {
  data: PaymentsByMethodRow[];
  summary: { totalAmount: number; totalTx: number; avgPerTx: number; topMethod: string | null };
  period: { startDate: string; endDate: string };
};

export type PaymentsByStaffRow = {
  staffId: string | null;
  staffName: string;
  orderCount: number;
  txCount: number;
  total: number;
  avgPerTx: number;
};
export type PaymentsByStaffReport = {
  data: PaymentsByStaffRow[];
  summary: { staffCount: number; totalAmount: number; totalTx: number; avgPerStaff: number };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type PaymentsByTimeRow = {
  period: string;
  txCount: number;
  cashTotal: number;
  bankTotal: number;
  cardTotal: number;
  total: number;
  orderCount: number;
};
export type PaymentsByTimeReport = {
  data: PaymentsByTimeRow[];
  summary: { totalAmount: number; totalTx: number; avgPerDay: number; peakPeriod: string | null };
  compare: {
    totalAmount: number | null;
    delta: { totalAmount: number | null; totalTx: number | null };
  } | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
  groupBy: "day" | "week" | "month";
};

// ── Client ───────────────────────────────────────────────────────────────────

const BASE = "/api/admin/reports/sales";

export const salesReportsClient = {
  async getByTime(params: DateRange & { groupBy?: "day" | "week" | "month"; compare?: boolean }) {
    return axios.get<SalesByTimeReport>(`${BASE}/by-time`, {
      params: { ...params, compare: params.compare ? "1" : "0" },
    }) as unknown as Promise<SalesByTimeReport>;
  },

  async getByStaff(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<SalesByStaffReport>(`${BASE}/by-staff`, {
      params,
    }) as unknown as Promise<SalesByStaffReport>;
  },

  async getByProduct(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<SalesByProductReport>(`${BASE}/by-product`, {
      params,
    }) as unknown as Promise<SalesByProductReport>;
  },

  async getByCustomer(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<SalesByCustomerReport>(`${BASE}/by-customer`, {
      params,
    }) as unknown as Promise<SalesByCustomerReport>;
  },

  async getByOrder(
    params: DateRange & {
      search?: string;
      paymentStatus?: string;
      fulfillmentStatus?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<SalesByOrderReport>(`${BASE}/by-order`, {
      params,
    }) as unknown as Promise<SalesByOrderReport>;
  },

  async getPaymentsByMethod(params: DateRange) {
    return axios.get<PaymentsByMethodReport>(`${BASE}/payments-by-method`, {
      params,
    }) as unknown as Promise<PaymentsByMethodReport>;
  },

  async getPaymentsByStaff(params: DateRange & { search?: string; page?: number; limit?: number }) {
    return axios.get<PaymentsByStaffReport>(`${BASE}/payments-by-staff`, {
      params,
    }) as unknown as Promise<PaymentsByStaffReport>;
  },

  async getPaymentsByTime(
    params: DateRange & { groupBy?: "day" | "week" | "month"; compare?: boolean },
  ) {
    return axios.get<PaymentsByTimeReport>(`${BASE}/payments-by-time`, {
      params: { ...params, compare: params.compare ? "1" : "0" },
    }) as unknown as Promise<PaymentsByTimeReport>;
  },
};

// ── Export URL builder ───────────────────────────────────────────────────────

type SalesReportSlug =
  | "by-time"
  | "by-staff"
  | "by-product"
  | "by-customer"
  | "by-order"
  | "payments-by-method"
  | "payments-by-staff"
  | "payments-by-time";

export function buildSalesExportUrl(
  slug: SalesReportSlug,
  params: DateRange & {
    format: "csv" | "xlsx";
    groupBy?: "day" | "week" | "month";
    compare?: boolean;
    search?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
  },
): string {
  const q = new URLSearchParams();
  q.set("startDate", params.startDate);
  q.set("endDate", params.endDate);
  q.set("format", params.format);
  if (params.groupBy) q.set("groupBy", params.groupBy);
  if (params.compare) q.set("compare", "1");
  if (params.search) q.set("search", params.search);
  if (params.paymentStatus) q.set("paymentStatus", params.paymentStatus);
  if (params.fulfillmentStatus) q.set("fulfillmentStatus", params.fulfillmentStatus);
  return `${BASE}/${slug}/export?${q.toString()}`;
}
