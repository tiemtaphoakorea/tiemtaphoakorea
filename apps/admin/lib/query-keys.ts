/**
 * Central React Query key definitions. Do not use ad-hoc string tuples in components.
 */

export const QUERY_CACHE_PERSIST_KEY = "admin-query-cache";

const QK = {
  adminRoot: "admin",
  profile: "profile",
  analytics: "analytics",
  chat: "chat",
  chatRooms: "rooms",
  chatMessages: "messages",
  supplierOrders: "supplier-orders",
  adminProducts: "products",
  adminSuppliers: "suppliers",
  expenses: "expenses",
  finance: "finance",
  financeStatsLeaf: "stats",
  dashboardRoot: "dashboard",
  topProducts: "top-products",
  recentOrders: "recent-orders",
  kpi: "kpi",
  productsRoot: "products",
  productVariants: "variants",
  productEditRoot: "product-edit",
  productCategories: "product-categories",
  customersRoot: "customers",
  customerSearchLeaf: "search",
  categoriesRoot: "categories",
  ordersRoot: "orders",
  orderStatsLeaf: "stats",
  orderDetailRoot: "order",
  customerDetailRoot: "customer",
  usersRoot: "users",
  suppliersRoot: "suppliers",
  debtsRoot: "debts",
} as const;

const INCLUDE_VARIANTS = { include: "variants" as const };
const SUPPLIER_STATUS_ACTIVE = { status: "active" as const };

export const queryKeys = {
  admin: {
    profile: [QK.adminRoot, QK.profile] as const,
    analytics: [QK.adminRoot, QK.analytics] as const,
    stockAlerts: [QK.adminRoot, "stock-alerts"] as const,
    debtSummary: [QK.adminRoot, "debt-summary"] as const,
    products: {
      all: [QK.adminRoot, QK.adminProducts] as const,
      withVariants: [QK.adminRoot, QK.adminProducts, INCLUDE_VARIANTS] as const,
    },
    suppliersActive: [QK.adminRoot, QK.adminSuppliers, SUPPLIER_STATUS_ACTIVE] as const,
    supplierOrders: {
      all: [QK.adminRoot, QK.supplierOrders] as const,
      list: (search: string, status: string) =>
        [QK.adminRoot, QK.supplierOrders, { search, status }] as const,
      detail: (id: string) => [QK.adminRoot, QK.supplierOrders, id] as const,
    },
    expenses: {
      all: [QK.adminRoot, QK.expenses] as const,
      list: (type: string, page: number, limit: number) =>
        [QK.adminRoot, QK.expenses, type, page, limit] as const,
    },
    finance: {
      all: [QK.adminRoot, QK.finance] as const,
      stats: (date?: { month: number; year: number }) =>
        [QK.adminRoot, QK.finance, QK.financeStatsLeaf, date ?? "all"] as const,
      statsByRange: (params: { startDate: string; endDate: string }) =>
        [QK.adminRoot, QK.finance, QK.financeStatsLeaf, params] as const,
      dayOrders: (date: string) => [QK.adminRoot, QK.finance, "day-orders", date] as const,
      daily: (params: { startDate: string; endDate: string }) =>
        [QK.adminRoot, QK.finance, "daily", params] as const,
    },
    chat: {
      rooms: {
        all: [QK.adminRoot, QK.chat, QK.chatRooms] as const,
        list: (searchTerm: string) => [QK.adminRoot, QK.chat, QK.chatRooms, searchTerm] as const,
      },
      messages: (roomId: string | null) =>
        [QK.adminRoot, QK.chat, QK.chatMessages, roomId] as const,
    },
    inventory: {
      movements: (params: Record<string, unknown>) =>
        ["admin", "inventory", "movements", params] as const,
      dailySummary: (params: Record<string, unknown>) =>
        ["admin", "inventory", "daily-summary", params] as const,
      valuation: (params: Record<string, unknown>) =>
        ["admin", "inventory", "valuation", params] as const,
      flow: (params: Record<string, unknown>) => ["admin", "inventory", "flow", params] as const,
    },
    purchases: {
      all: [QK.adminRoot, "purchases"] as const,
      list: (params: Record<string, unknown>) => [QK.adminRoot, "purchases", params] as const,
      detail: (id: string) => [QK.adminRoot, "purchases", id] as const,
    },
    receipts: {
      all: [QK.adminRoot, "receipts"] as const,
      list: (params: Record<string, unknown>) => [QK.adminRoot, "receipts", params] as const,
      detail: (id: string) => [QK.adminRoot, "receipts", id] as const,
    },
    payouts: {
      all: [QK.adminRoot, "payouts"] as const,
      list: (params: Record<string, unknown>) => [QK.adminRoot, "payouts", params] as const,
    },
    supplierDebts: [QK.adminRoot, "supplier-debts"] as const,
  },
  dashboard: {
    topProducts: [QK.dashboardRoot, QK.topProducts] as const,
    recentOrders: [QK.dashboardRoot, QK.recentOrders] as const,
    kpi: [QK.dashboardRoot, QK.kpi] as const,
  },
  products: {
    all: [QK.productsRoot] as const,
    list: (search: string, page: number, limit: number, stockStatus: string) =>
      [QK.productsRoot, search, page, limit, stockStatus] as const,
    variants: (debouncedSearch: string) =>
      [QK.productsRoot, QK.productVariants, debouncedSearch] as const,
  },
  productEdit: (id: string) => [QK.productEditRoot, id] as const,
  // Nested under categoriesRoot so invalidating categories.all also covers this key
  productCategories: [QK.categoriesRoot, "for-products"] as const,
  customers: {
    all: [QK.customersRoot] as const,
    stats: [QK.customersRoot, "stats"] as const,
    tierConfig: [QK.customersRoot, "tier-config"] as const,
    list: (
      searchTerm: string,
      statusFilter: string,
      page: number,
      limit: number,
      typeFilter?: string,
    ) => [QK.customersRoot, searchTerm, statusFilter, page, limit, typeFilter] as const,
    search: (debouncedSearch: string) =>
      [QK.customersRoot, QK.customerSearchLeaf, debouncedSearch] as const,
  },
  categories: {
    all: [QK.categoriesRoot] as const,
    list: (searchTerm: string, page: number, limit: number) =>
      [QK.categoriesRoot, searchTerm, page, limit] as const,
  },
  orders: {
    list: (
      searchTerm: string,
      paymentStatus: string,
      fulfillmentStatus: string,
      debtOnly: boolean,
      page: number,
      limit: number,
    ) =>
      [QK.ordersRoot, searchTerm, paymentStatus, fulfillmentStatus, debtOnly, page, limit] as const,
    stats: [QK.ordersRoot, QK.orderStatsLeaf] as const,
  },
  order: (id: string) => [QK.orderDetailRoot, id] as const,
  customer: (id: string) => [QK.customerDetailRoot, id] as const,
  users: {
    all: [QK.usersRoot] as const,
    list: (searchTerm: string, page: number, limit: number) =>
      [QK.usersRoot, searchTerm, page, limit] as const,
  },
  suppliers: {
    all: [QK.suppliersRoot] as const,
    list: (searchTerm: string, page: number, limit: number) =>
      [QK.suppliersRoot, searchTerm, page, limit] as const,
  },
  banners: {
    all: ["banners"] as const,
    list: ["banners", "list"] as const,
  },
  homepageCollections: {
    all: ["homepage-collections"] as const,
    list: ["homepage-collections", "list"] as const,
    detail: (id: string) => ["homepage-collections", "detail", id] as const,
  },
  debts: {
    all: [QK.debtsRoot] as const,
    list: (search: string, minAgeDays: number | null, page: number, limit: number) =>
      [QK.debtsRoot, search, minAgeDays, page, limit] as const,
  },
  customerDebt: (customerId: string) => ["customer-debt", customerId] as const,
  settings: {
    shopInfo: ["settings", "shop-info"] as const,
    branding: ["settings", "branding"] as const,
  },
} as const;
