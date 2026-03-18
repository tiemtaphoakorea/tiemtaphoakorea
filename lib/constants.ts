export const ADMIN_BASE_URL =
  process.env.ADMIN_BASE_URL || "http://admin.localhost:3000";
export const STOREFRONT_BASE_URL =
  process.env.STOREFRONT_BASE_URL || "http://localhost:3000";
export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost";

export const ROLE = {
  CUSTOMER: "customer",
  OWNER: "owner",
  MANAGER: "manager",
  STAFF: "staff",
} as const;

/** User status → label + Tailwind classes for badge (admin users page) */
export const USER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  Active: {
    label: "Hoạt động",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  Inactive: {
    label: "Tạm khóa",
    color: "bg-slate-50 text-slate-600 border-slate-100",
  },
};

/** User role → label + Tailwind classes for badge (admin users page) */
export const USER_ROLE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  owner: {
    label: "Owner",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  manager: {
    label: "Manager",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  staff: {
    label: "Staff",
    color: "bg-slate-50 text-slate-600 border-slate-100",
  },
};

export const INTERNAL_ROLES = [ROLE.OWNER, ROLE.MANAGER, ROLE.STAFF] as const;

export const INTERNAL_CHAT_ROLES = INTERNAL_ROLES;

export const CUSTOMER_TYPE = {
  RETAIL: "retail",
  WHOLESALE: "wholesale",
} as const;

export const STOCK_TYPE = {
  IN_STOCK: "in_stock",
  PRE_ORDER: "pre_order",
} as const;

export const DELIVERY_PREFERENCE = {
  SHIP_TOGETHER: "ship_together",
  SHIP_AVAILABLE_FIRST: "ship_available_first",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  PREPARING: "preparing",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const ORDER_STATUS_ALL = "All";

export const SUPPLIER_ORDER_STATUS = {
  PENDING: "pending",
  ORDERED: "ordered",
  RECEIVED: "received",
  CANCELLED: "cancelled",
} as const;

export const SUPPLIER_ORDER_STATUS_ALL = "All";

export const PAYMENT_METHOD = {
  CASH: "cash",
  BANK_TRANSFER: "bank_transfer",
  CARD: "card",
} as const;

export const PRODUCT_SORT = {
  LATEST: "latest",
  PRICE_ASC: "price-asc",
  PRICE_DESC: "price-desc",
} as const;

export const CUSTOMER_CODE_PREFIX = "KH";
export const SUPPLIER_CODE_PREFIX = "NCC";
export const ORDER_CODE_PREFIX = "ORD";
export const GUEST_CODE_PREFIX = "guest_";

export const CUSTOMER_EMAIL_DOMAIN = "shop.internal";
export const GUEST_EMAIL_DOMAIN = "anon.local";

export const CODE_PAD_LENGTH = 3;
export const CODE_PAD_CHAR = "0";

export const DEFAULT_PASSWORD_LENGTH = 8;

export const CHAT_MESSAGE_TYPE = {
  TEXT: "text",
  IMAGE: "image",
} as const;

export const CHAT_TEXT_MAX_LENGTH = 2000;
export const CHAT_BUCKET_NAME = "chat-images";
export const CHAT_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const CHAT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const CHAT_MESSAGES_PAGE_LIMIT_DEFAULT = 50;

export const STORAGE_CACHE_CONTROL = "3600";
export const PRODUCT_IMAGE_BUCKET_NAME =
  process.env.SUPABASE_PRODUCT_IMAGE_BUCKET || "product-images";
export const PRODUCT_IMAGE_PATH_PREFIX = "products";

export const DASHBOARD_DEFAULT_LIMIT = 5;
export const LOW_STOCK_DEFAULT_THRESHOLD = 5;

export const FEATURED_PRODUCTS_LIMIT_DEFAULT = 8;

export const ANALYTICS_TOP_PRODUCTS_LIMIT = 4;
export const ANALYTICS_DEFAULT_CONVERSION_RATE = 3.45;
export const ANALYTICS_GROWTH_RANDOM_RANGE = 20;
export const ANALYTICS_GROWTH_RANDOM_OFFSET = -5;

export const ADMIN_STATS_SECTION = {
  KPI: "kpi",
  RECENT_ORDERS: "recent-orders",
  TOP_PRODUCTS: "top-products",
} as const;

export const CUSTOMER_ACTION_INTENT = {
  TOGGLE_STATUS: "toggleStatus",
  RESET_PASSWORD: "resetPassword",
} as const;

export const AUTH_BAN_DURATION = {
  NONE: "none",
  LONG: "876000h",
} as const;

export const VARIANT_ID_PREFIX = {
  GENERATED: "gen-",
  TEMP: "temp-",
} as const;

export const ORDER_SPLIT_SUFFIX = {
  IN_STOCK: "A",
  PRE_ORDER: "B",
} as const;

/** Admin dashboard route segment → display name (Vietnamese) */
export const ADMIN_ROUTE_NAMES: Record<string, string> = {
  finance: "Tài chính",
  users: "Nhân sự",
  suppliers: "Nhà cung cấp",
  expenses: "Chi phí",
  products: "Sản phẩm",
  orders: "Đơn hàng",
  "supplier-orders": "Đơn nhập hàng",
  customers: "Khách hàng",
  analytics: "Báo cáo",
  chat: "Tin nhắn",
  new: "Tạo mới",
  edit: "Chỉnh sửa",
};

export const ADMIN_TITLE = "K-SMART Admin";

export const ERROR_MESSAGE = {
  AUTH: {
    UNAUTHORIZED: "Unauthorized",
    CURRENT_PASSWORD_INVALID: "Mật khẩu hiện tại không đúng",
    CHANGE_PASSWORD_FAILED: "Có lỗi xảy ra khi đổi mật khẩu",
  },
  CUSTOMER: {
    NOT_FOUND_OR_NOT_LINKED: "Customer not found or not linked to auth",
  },
  CATEGORY: {
    SELF_PARENT: "A category cannot be its own parent",
  },
  ORDER: {
    NOT_FOUND: "Order not found",
    INSUFFICIENT_STOCK: "Insufficient stock",
    CANNOT_DELETE_WITH_STATUS: "Cannot delete order with status",
  },
  SUPPLIER_ORDER: {
    NOT_FOUND: "Supplier order not found",
  },
  USER: {
    AUTH_CREATE_FAILED: "Failed to create auth user",
    AUTH_CREATE_NO_DATA: "Failed to create auth user: No user data returned",
    PROFILE_CREATE_FAILED: "Failed to create user profile",
    NOT_FOUND_OR_CUSTOMER: "User not found or not an internal user",
  },
  CHAT: {
    EMPTY_MESSAGE: "Vui lòng nhập tin nhắn",
    MESSAGE_TOO_LONG: "Tin nhắn tối đa 2000 ký tự",
    INVALID_IMAGE_TYPE: "Chỉ hỗ trợ định dạng JPG, PNG, WebP",
    IMAGE_TOO_LARGE: "Kích thước file tối đa 5MB",
    UPLOAD_FAILED: "Upload thất bại",
  },
} as const;
