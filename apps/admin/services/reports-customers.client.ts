/**
 * Client-side fetchers for all 4 customer reports (6.1–6.4).
 * Mirrors the shape returned by each API route.
 */
import { axios } from "@workspace/shared/api-client";

type DateRange = { startDate: string; endDate: string };

// ─── 6.1 / 6.2 shared types ────────────────────────────────────────────────

export type CustomerAggregateRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
  aov: number;
  lastOrderAt: string | null;
};

export type CustomerAggregateReport = {
  data: CustomerAggregateRow[];
  summary: {
    customerCount: number;
    totalRevenue: number;
    avgRevenuePerCustomer: number;
    topRevenue: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

// ─── 6.3 types ──────────────────────────────────────────────────────────────

export type CustomersByProductRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  customerCount: number;
  orderCount: number;
  qty: number;
  revenue: number;
};

export type CustomersByProductReport = {
  data: CustomersByProductRow[];
  summary: {
    skuCount: number;
    totalUniqueCustomers: number;
    topProductName: string | null;
    avgCustomersPerSku: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type VariantCustomerRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  purchaseCount: number;
  totalQty: number;
  totalSpend: number;
};

export type VariantCustomerDrilldown = {
  data: VariantCustomerRow[];
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

// ─── 6.4 types ──────────────────────────────────────────────────────────────

export type SegmentBucket = "new" | "returning";

export type SegmentBucketRow = {
  bucket: SegmentBucket;
  customers: number;
  orders: number;
  revenue: number;
  profit: number;
  aov: number;
};

export type SegmentTimeSeries = {
  period: string;
  newCustomers: number;
  returningCustomers: number;
};

export type NewVsReturningReport = {
  data: SegmentBucketRow[];
  timeSeries: SegmentTimeSeries[];
  summary: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    newRate: number;
    returningRevenue: number;
  };
};

export type BucketCustomerRow = {
  customerId: string;
  fullName: string;
  phone: string | null;
  customerCode: string | null;
  orderCount: number;
  revenue: number;
};

export type BucketCustomerDrilldown = {
  data: BucketCustomerRow[];
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

// ─── Client ─────────────────────────────────────────────────────────────────

export const customersReportClient = {
  async getTopByRevenue(
    params: DateRange & { search?: string; page?: number; limit?: number },
  ): Promise<CustomerAggregateReport> {
    return axios.get<CustomerAggregateReport>("/api/admin/reports/customers/top-by-revenue", {
      params,
    }) as unknown as Promise<CustomerAggregateReport>;
  },

  async getTopByOrders(
    params: DateRange & { search?: string; page?: number; limit?: number },
  ): Promise<CustomerAggregateReport> {
    return axios.get<CustomerAggregateReport>("/api/admin/reports/customers/top-by-orders", {
      params,
    }) as unknown as Promise<CustomerAggregateReport>;
  },

  async getByProduct(
    params: DateRange & {
      search?: string;
      sortBy?: "customer_count" | "revenue" | "qty";
      page?: number;
      limit?: number;
    },
  ): Promise<CustomersByProductReport> {
    return axios.get<CustomersByProductReport>("/api/admin/reports/customers/by-product", {
      params,
    }) as unknown as Promise<CustomersByProductReport>;
  },

  async getVariantCustomers(
    params: DateRange & { variantId: string; page?: number; limit?: number },
  ): Promise<VariantCustomerDrilldown> {
    return axios.get<VariantCustomerDrilldown>("/api/admin/reports/customers/by-product", {
      params: { ...params, mode: "customers" },
    }) as unknown as Promise<VariantCustomerDrilldown>;
  },

  async getNewVsReturning(params: DateRange): Promise<NewVsReturningReport> {
    return axios.get<NewVsReturningReport>("/api/admin/reports/customers/new-vs-returning", {
      params,
    }) as unknown as Promise<NewVsReturningReport>;
  },

  async getBucketCustomers(
    params: DateRange & { bucket: SegmentBucket; page?: number; limit?: number },
  ): Promise<BucketCustomerDrilldown> {
    return axios.get<BucketCustomerDrilldown>("/api/admin/reports/customers/new-vs-returning", {
      params: { ...params, mode: "customers" },
    }) as unknown as Promise<BucketCustomerDrilldown>;
  },
};

// ─── Export URL builder ──────────────────────────────────────────────────────

export type CustomerReportSlug =
  | "top-by-revenue"
  | "top-by-orders"
  | "by-product"
  | "new-vs-returning";

export function buildCustomerExportUrl(
  slug: CustomerReportSlug,
  params: DateRange & {
    format: "csv" | "xlsx";
    search?: string;
    sortBy?: string;
  },
): string {
  const q = new URLSearchParams();
  q.set("startDate", params.startDate);
  q.set("endDate", params.endDate);
  q.set("format", params.format);
  if (params.search) q.set("search", params.search);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  return `/api/admin/reports/customers/${slug}/export?${q.toString()}`;
}
