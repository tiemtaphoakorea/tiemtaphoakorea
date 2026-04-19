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
    USERS: "/api/admin/users",
    CUSTOMERS: "/api/admin/customers",
    SUPPLIERS: "/api/admin/suppliers",
    EXPENSES: "/api/admin/expenses",
    FINANCE: "/api/admin/finance",
    ANALYTICS: "/api/admin/analytics",
    STOCK_ALERTS: "/api/admin/analytics/stock-alerts",
    LOGIN: "/api/admin/login",
    SUPPLIER_ORDERS: "/api/admin/supplier-orders",
    SUPPLIER_ORDER_DETAIL: (id: string) => `/api/admin/supplier-orders/${id}`,
    BANNERS: "/api/admin/banners",
    BANNER_DETAIL: (id: string) => `/api/admin/banners/${id}`,
    BANNERS_REORDER: "/api/admin/banners/reorder",
  },
  CHAT: {
    SEND: "/api/chat",
    UPLOAD: "/api/chat",
  },
  COMMON: {
    UPLOAD: "/api/upload",
  },
} as const;
