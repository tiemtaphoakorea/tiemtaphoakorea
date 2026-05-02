/**
 * API Endpoint constants to avoid hardcoded strings throughout the application.
 */

export const API_ENDPOINTS = {
  ADMIN: {
    PROFILE: "/api/admin/profile",
    STATS: "/api/admin/stats",
    LOGOUT: "/api/admin/logout",
    CHAT: {
      ROOMS: "/api/admin/chat",
      DETAILS: (roomId: string) => `/api/admin/chat?roomId=${roomId}`,
    },
    PRODUCTS: "/api/admin/products",
    CATEGORIES: "/api/admin/categories",
    CATEGORY_DETAIL: (id: string) => `/api/admin/categories/${id}`,
    ORDERS: "/api/admin/orders",
    ORDER_STATS: "/api/admin/orders/stats",
    DEBTS: "/api/admin/debts",
    DEBT_DETAIL: (customerId: string) => `/api/admin/debts/${customerId}`,
    DEBT_SUMMARY: "/api/admin/debts/summary",
    USERS: "/api/admin/users",
    CUSTOMERS: "/api/admin/customers",
    CUSTOMER_STATS: "/api/admin/customers/stats",
    SETTINGS_CUSTOMER_TIER: "/api/admin/settings/customer-tier",
    SUPPLIERS: "/api/admin/suppliers",
    EXPENSES: "/api/admin/expenses",
    FINANCE: "/api/admin/finance",
    FINANCE_DAILY: "/api/admin/finance/daily",
    FINANCE_DAY_ORDERS: (date: string) => `/api/admin/finance/daily/${date}`,
    ANALYTICS: "/api/admin/analytics",
    STOCK_ALERTS: "/api/admin/analytics/stock-alerts",
    LOGIN: "/api/admin/login",
    SUPPLIER_ORDERS: "/api/admin/supplier-orders",
    SUPPLIER_ORDER_DETAIL: (id: string) => `/api/admin/supplier-orders/${id}`,
    BANNERS: "/api/admin/banners",
    BANNER_DETAIL: (id: string) => `/api/admin/banners/${id}`,
    BANNERS_REORDER: "/api/admin/banners/reorder",
    HOMEPAGE_COLLECTIONS: "/api/admin/homepage-collections",
    HOMEPAGE_COLLECTION_DETAIL: (id: string) => `/api/admin/homepage-collections/${id}`,
    HOMEPAGE_COLLECTIONS_REORDER: "/api/admin/homepage-collections/reorder",
    HOMEPAGE_COLLECTION_PRODUCTS: (id: string) => `/api/admin/homepage-collections/${id}/products`,
    INVENTORY: {
      MOVEMENTS: "/api/admin/inventory/movements",
      ADJUST: "/api/admin/inventory/movements/adjust",
      DAILY_SUMMARY: "/api/admin/inventory/movements/daily-summary",
    },
  },
  CHAT: {
    SEND: "/api/chat",
    UPLOAD: "/api/chat",
  },
  COMMON: {
    UPLOAD: "/api/upload",
  },
} as const;
