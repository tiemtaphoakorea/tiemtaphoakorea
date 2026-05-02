/**
 * Centralized route paths for the application.
 * Use these constants instead of hardcoding route strings.
 */

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
export const PUBLIC_ROUTES = {
  HOME: "/",
  PRODUCTS: "/product",
  PRODUCTS_BY_CATEGORY: (category: string) => `/product?category=${encodeURIComponent(category)}`,
  PRODUCTS_BY_SORT: (sort: string) => `/product?sort=${sort}`,
  PRODUCT_DETAIL: (id: string | number) => `/product/${id}`,
} as const;

// ============================================================================
// ADMIN ROUTES
// ============================================================================
export const ADMIN_ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  DASHBOARD: "/",

  // Products
  PRODUCTS: "/products",
  PRODUCTS_ADD: "/products?add=true",

  // Categories
  CATEGORIES: "/categories",

  // Orders
  ORDERS: "/orders",
  ORDERS_NEW: "/orders/new",
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,

  // Inventory (đơn nhập hàng + biến động kho)
  INVENTORY: "/inventory",

  // Suppliers
  SUPPLIERS: "/suppliers",

  // Customers
  CUSTOMERS: "/customers",
  CUSTOMER_DETAIL: (id: string | number) => `/customers/${id}`,

  // Debts
  DEBTS: "/debts",
  DEBT_DETAIL: (customerId: string | number) => `/debts/${customerId}`,

  // Chat
  CHAT: "/chat",
  CHAT_ROOM: (roomId: string) => `/chat/${roomId}`,

  // Analytics
  ANALYTICS: "/analytics",
  ANALYTICS_OVERVIEW: "/analytics/overview",
  ANALYTICS_PRODUCTS: "/analytics/products",
  ANALYTICS_INVENTORY: "/analytics/inventory",
  ANALYTICS_FINANCE: "/analytics/finance",
  ANALYTICS_FINANCE_DETAIL: "/analytics/finance/detail",

  // Finance
  EXPENSES: "/expenses",

  // Users (Staff Management)
  USERS: "/users",

  // Site Settings (includes homepage banners + nav config)
  SETTINGS: "/settings",

  // Design System reference (owner-only)
  DESIGN_SYSTEM: "/design-system",
} as const;

// ============================================================================
// ACCOUNT ROUTES (Customer Account)
// ============================================================================
export const ACCOUNT_ROUTES = {
  ROOT: "/account",
  OVERVIEW: "/account",
  ORDERS: "/account/orders",
  ORDER_DETAIL: (id: string | number) => `/account/orders/${id}`,
  CHAT: "/account/chat",
  WISHLIST: "/account/wishlist",
} as const;

// ============================================================================
// API ROUTES
// ============================================================================
export const API_ROUTES = {
  CHAT_SEND: "/api/chat/send",
  CHAT_UPLOAD: "/api/chat/upload",
} as const;

// ============================================================================
// COMBINED ROUTES (for convenience)
// ============================================================================
export const ROUTES = {
  PUBLIC: PUBLIC_ROUTES,
  ADMIN: ADMIN_ROUTES,
  ACCOUNT: ACCOUNT_ROUTES,
  API: API_ROUTES,
} as const;

// Default export for simpler imports
export default ROUTES;
