import { axios } from "@workspace/shared/api-client";

// Mirror server response types — kept local to avoid coupling React Query layer to db internals.
export type PnLMetrics = {
  salesRevenue: number;
  cogs: number;
  grossProfit: number;
  otherIncome: number;
  otherExpense: number;
  netProfit: number;
  orderCount: number;
  missingCostItems: number;
  missingCostOrderCount: number;
  missingCostRate: number;
  excludedRevenue: number;
};

export type ProfitLossReport = {
  current: PnLMetrics;
  previous: PnLMetrics | null;
  delta: Record<keyof PnLMetrics, number> | null;
  period: { startDate: string; endDate: string };
  previousPeriod: { startDate: string; endDate: string } | null;
};

export type MissingCostOrderItem = {
  orderItemId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  lineCost: number;
  currentCostPrice: number;
};

export type MissingCostOrderRow = {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  stockOutAt: string | null;
  revenue: number;
  missingCostItemCount: number;
  items: MissingCostOrderItem[];
};

export type MissingCostOrdersReport = {
  data: MissingCostOrderRow[];
  summary: {
    orderCount: number;
    itemCount: number;
    excludedRevenue: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type ProfitByOrderSort = "recent" | "profit_desc" | "profit_asc" | "margin_desc";

export type ProfitByOrderItem = {
  orderItemId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  costPriceAtOrderTime: number;
  lineTotal: number;
  lineCost: number;
  lineProfit: number;
  lineProfitPct: number;
};

export type ProfitByOrderRow = {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  stockOutAt: string | null;
  revenue: number;
  cost: number;
  profit: number;
  profitPct: number;
  itemCount: number;
  items: ProfitByOrderItem[];
};

export type ProfitByOrderReport = {
  data: ProfitByOrderRow[];
  summary: {
    orderCount: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
  period: { startDate: string; endDate: string };
};

export type CustomerDebtRow = {
  customerId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerCode: string | null;
  openingDebt: number;
  debtIncrease: number;
  debtDecrease: number;
  closingDebt: number;
};

export type CustomerDebtsReport = {
  data: CustomerDebtRow[];
  summary: {
    openingDebt: number;
    debtIncrease: number;
    debtDecrease: number;
    closingDebt: number;
    customerCount: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type SupplierDebtRow = {
  supplierId: string;
  supplierName: string | null;
  supplierCode: string | null;
  supplierPhone: string | null;
  openingDebt: number;
  debtIncrease: number;
  debtDecrease: number;
  closingDebt: number;
};

export type SupplierDebtsReport = {
  data: SupplierDebtRow[];
  summary: {
    openingDebt: number;
    debtIncrease: number;
    debtDecrease: number;
    closingDebt: number;
    supplierCount: number;
  };
  metadata: { total: number; page: number; totalPages: number; limit: number };
};

export type DebtTransaction = {
  id: string;
  date: string;
  kind: "order" | "payment" | "receipt";
  reference: string;
  amount: number;
  note: string | null;
};

export type CashFlowPeriodRow = {
  period: string;
  inflow: number;
  outflow: number;
  net: number;
};

export type CashFlowReport = {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  byPeriod: CashFlowPeriodRow[];
  breakdown: {
    customerPayments: number;
    supplierPayments: number;
    expenses: number;
  };
};

export type CashFlowTransaction = {
  id: string;
  date: string;
  kind: "customer-payment" | "supplier-payment" | "expense";
  reference: string;
  party: string | null;
  amount: number;
  note: string | null;
};

type ReportDateRange = { startDate: string; endDate: string };

export const reportsClient = {
  async getProfitLoss(params: ReportDateRange & { compare?: boolean }) {
    return axios.get<ProfitLossReport>("/api/admin/reports/profit-loss", {
      params: { ...params, compare: params.compare === false ? "0" : "1" },
    }) as unknown as Promise<ProfitLossReport>;
  },

  async getMissingCostOrders(
    params: ReportDateRange & {
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<MissingCostOrdersReport>("/api/admin/reports/profit-loss/missing-cost", {
      params,
    }) as unknown as Promise<MissingCostOrdersReport>;
  },

  async updateMissingCostOrderItem(params: {
    orderId: string;
    orderItemId: string;
    unitCost: number;
    note?: string;
    clientToken?: string;
  }) {
    const { orderId, orderItemId, unitCost, note, clientToken } = params;
    return axios.post<{ success: boolean }>(
      `/api/admin/orders/${orderId}/items/${orderItemId}/cost`,
      { unitCost, note, clientToken },
    ) as unknown as Promise<{ success: boolean }>;
  },

  async getProfitByOrder(
    params: ReportDateRange & {
      search?: string;
      sort?: ProfitByOrderSort;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<ProfitByOrderReport>("/api/admin/reports/profit-loss/by-order", {
      params,
    }) as unknown as Promise<ProfitByOrderReport>;
  },

  async getCustomerDebts(
    params: ReportDateRange & {
      search?: string;
      includeZero?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<CustomerDebtsReport>("/api/admin/reports/customer-debts", {
      params: { ...params, includeZero: params.includeZero ? "1" : undefined },
    }) as unknown as Promise<CustomerDebtsReport>;
  },

  async getCustomerDebtTransactions(customerId: string, params: ReportDateRange) {
    return axios.get<{ increases: DebtTransaction[]; decreases: DebtTransaction[] }>(
      `/api/admin/reports/customer-debts/${customerId}/transactions`,
      { params },
    ) as unknown as Promise<{ increases: DebtTransaction[]; decreases: DebtTransaction[] }>;
  },

  async getSupplierDebts(
    params: ReportDateRange & {
      search?: string;
      includeZero?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    return axios.get<SupplierDebtsReport>("/api/admin/reports/supplier-debts", {
      params: { ...params, includeZero: params.includeZero ? "1" : undefined },
    }) as unknown as Promise<SupplierDebtsReport>;
  },

  async getSupplierDebtTransactions(supplierId: string, params: ReportDateRange) {
    return axios.get<{ increases: DebtTransaction[]; decreases: DebtTransaction[] }>(
      `/api/admin/reports/supplier-debts/${supplierId}/transactions`,
      { params },
    ) as unknown as Promise<{ increases: DebtTransaction[]; decreases: DebtTransaction[] }>;
  },

  async getCashFlow(params: ReportDateRange & { groupBy?: "day" | "week" | "month" }) {
    return axios.get<CashFlowReport>("/api/admin/reports/cash-flow", {
      params,
    }) as unknown as Promise<CashFlowReport>;
  },

  async getCashFlowTransactions(params: ReportDateRange) {
    return axios.get<{ data: CashFlowTransaction[] }>("/api/admin/reports/cash-flow/transactions", {
      params,
    }) as unknown as Promise<{ data: CashFlowTransaction[] }>;
  },
};

export function buildExportUrl(
  report: "profit-loss" | "customer-debts" | "supplier-debts" | "cash-flow",
  params: ReportDateRange & {
    format: "csv" | "csv-detail" | "xlsx";
    compare?: boolean;
    includeZero?: boolean;
    search?: string;
    groupBy?: "day" | "week" | "month";
  },
): string {
  const q = new URLSearchParams();
  q.set("startDate", params.startDate);
  q.set("endDate", params.endDate);
  q.set("format", params.format);
  if (params.compare === false) q.set("compare", "0");
  if (params.includeZero) q.set("includeZero", "1");
  if (params.search) q.set("search", params.search);
  if (params.groupBy) q.set("groupBy", params.groupBy);
  return `/api/admin/reports/${report}/export?${q.toString()}`;
}
