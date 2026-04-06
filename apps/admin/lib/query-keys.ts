/**
 * Central React Query key definitions. Do not use ad-hoc string tuples in components.
 */

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
} as const;

const INCLUDE_VARIANTS = { include: "variants" as const };
const SUPPLIER_STATUS_ACTIVE = { status: "active" as const };

export const queryKeys = {
  admin: {
    profile: [QK.adminRoot, QK.profile] as const,
    analytics: [QK.adminRoot, QK.analytics] as const,
    products: {
      all: [QK.adminRoot, QK.adminProducts] as const,
      withVariants: [QK.adminRoot, QK.adminProducts, INCLUDE_VARIANTS] as const,
    },
    suppliersActive: [QK.adminRoot, QK.adminSuppliers, SUPPLIER_STATUS_ACTIVE] as const,
    supplierOrders: {
      all: [QK.adminRoot, QK.supplierOrders] as const,
      list: (search: string, status: string) =>
        [QK.adminRoot, QK.supplierOrders, { search, status }] as const,
    },
    expenses: {
      all: [QK.adminRoot, QK.expenses] as const,
      list: (type: string, page: number, limit: number) =>
        [QK.adminRoot, QK.expenses, type, page, limit] as const,
    },
    finance: {
      all: [QK.adminRoot, QK.finance] as const,
      stats: (date: { month: number; year: number }) =>
        [QK.adminRoot, QK.finance, QK.financeStatsLeaf, date] as const,
    },
    chat: {
      rooms: {
        all: [QK.adminRoot, QK.chat, QK.chatRooms] as const,
        list: (searchTerm: string) => [QK.adminRoot, QK.chat, QK.chatRooms, searchTerm] as const,
      },
      messages: (roomId: string | null) =>
        [QK.adminRoot, QK.chat, QK.chatMessages, roomId] as const,
    },
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
  productCategories: [QK.productCategories] as const,
  customers: {
    all: [QK.customersRoot] as const,
    list: (searchTerm: string, statusFilter: string, page: number, limit: number) =>
      [QK.customersRoot, searchTerm, statusFilter, page, limit] as const,
    search: (debouncedSearch: string) =>
      [QK.customersRoot, QK.customerSearchLeaf, debouncedSearch] as const,
  },
  categories: {
    all: [QK.categoriesRoot] as const,
    list: (searchTerm: string) => [QK.categoriesRoot, searchTerm] as const,
  },
  orders: {
    list: (searchTerm: string, statusFilter: string, page: number, limit: number) =>
      [QK.ordersRoot, searchTerm, statusFilter, page, limit] as const,
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
    list: (searchTerm: string) => [QK.suppliersRoot, searchTerm] as const,
  },
} as const;
