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
  ABOUT: "/about",
  CONTACT: "/contact",
  SHIPPING: "/shipping",
  RETURNS: "/returns",
  ORDER_LOOKUP: "/order-lookup",
  TERMS: "/terms",
  PRIVACY: "/privacy",
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
  INVENTORY_OPENING_STOCK: "/inventory/opening-stock",

  // Sapo-faithful purchase workflow
  PURCHASES: "/purchases",
  PURCHASE_DETAIL: (id: string | number) => `/purchases/${id}`,
  RECEIPTS: "/receipts",
  RECEIPT_DETAIL: (id: string | number) => `/receipts/${id}`,
  PAYOUTS: "/payouts",

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
  ANALYTICS_DEBTS: "/analytics/debts",

  // Reports (Báo cáo Sapo-style — 5 nhóm × 25 báo cáo)
  REPORTS: "/reports",

  // Reports — Tài chính (4)
  REPORTS_PROFIT_LOSS: "/reports/profit-loss",
  REPORTS_PROFIT_LOSS_BY_ORDER: "/reports/profit-loss/by-order",
  REPORTS_PROFIT_LOSS_MISSING_COST: "/reports/profit-loss/missing-cost",
  REPORTS_CUSTOMER_DEBTS: "/reports/customer-debts",
  REPORTS_SUPPLIER_DEBTS: "/reports/supplier-debts",
  REPORTS_CASH_FLOW: "/reports/cash-flow",

  // Reports — Bán hàng (8)
  REPORTS_SALES_BY_TIME: "/reports/sales/by-time",
  REPORTS_SALES_BY_STAFF: "/reports/sales/by-staff",
  REPORTS_SALES_BY_PRODUCT: "/reports/sales/by-product",
  REPORTS_SALES_BY_CUSTOMER: "/reports/sales/by-customer",
  REPORTS_SALES_BY_ORDER: "/reports/sales/by-order",
  REPORTS_SALES_PAYMENTS_BY_METHOD: "/reports/sales/payments-by-method",
  REPORTS_SALES_PAYMENTS_BY_STAFF: "/reports/sales/payments-by-staff",
  REPORTS_SALES_PAYMENTS_BY_TIME: "/reports/sales/payments-by-time",

  // Reports — Nhập hàng (5)
  REPORTS_PURCHASES_BY_TIME: "/reports/purchases/by-time",
  REPORTS_PURCHASES_BY_SUPPLIER: "/reports/purchases/by-supplier",
  REPORTS_PURCHASES_BY_PRODUCT: "/reports/purchases/by-product",
  REPORTS_PURCHASES_BY_STAFF: "/reports/purchases/by-staff",
  REPORTS_PURCHASES_PAYOUTS_BY_METHOD: "/reports/purchases/payouts-by-method",

  // Reports — Kho (4)
  REPORTS_INVENTORY_CURRENT_STOCK: "/reports/inventory/current-stock",
  REPORTS_INVENTORY_LEDGER: "/reports/inventory/ledger",
  REPORTS_INVENTORY_IN_OUT_MOVEMENT: "/reports/inventory/in-out-movement",
  REPORTS_INVENTORY_LOW_STOCK: "/reports/inventory/low-stock",

  // Reports — Khách hàng (4)
  REPORTS_CUSTOMERS_TOP_BY_REVENUE: "/reports/customers/top-by-revenue",
  REPORTS_CUSTOMERS_TOP_BY_ORDERS: "/reports/customers/top-by-orders",
  REPORTS_CUSTOMERS_BY_PRODUCT: "/reports/customers/by-product",
  REPORTS_CUSTOMERS_NEW_VS_RETURNING: "/reports/customers/new-vs-returning",

  // Finance
  EXPENSES: "/expenses",

  // Users (Staff Management)
  USERS: "/users",

  // Homepage Collections
  HOMEPAGE: "/homepage",

  // Site Settings
  SETTINGS: "/settings",
  SETTINGS_CONTENT: "/content",
  SETTINGS_WIDGETS: "/widgets",

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
