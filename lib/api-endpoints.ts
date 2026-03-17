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
    ORDERS: "/api/admin/orders",
    ORDER_STATS: "/api/admin/orders/stats",
    USERS: "/api/admin/users",
    CUSTOMERS: "/api/admin/customers",
    SUPPLIERS: "/api/admin/suppliers",
    EXPENSES: "/api/admin/expenses",
    FINANCE: "/api/admin/finance",
    ANALYTICS: "/api/admin/analytics",
    LOGIN: "/api/admin/login",
    SUPPLIER_ORDERS: "/api/admin/supplier-orders",
    SUPPLIER_ORDER_DETAIL: (id: string) => `/api/admin/supplier-orders/${id}`,
  },
  CHAT: {
    SEND: "/api/chat",
    UPLOAD: "/api/chat",
  },
  COMMON: {
    UPLOAD: "/api/upload",
  },
} as const;
