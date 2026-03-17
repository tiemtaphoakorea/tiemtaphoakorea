import type { UserRole } from "@/db/schema/enums";
import type { ProductVariant as DBProductVariant, Order, OrderItem } from "./order";

// --- Dashboard Stats ---
export interface DashboardKPIs {
  todayRevenue: number;
  todayOrdersCount: number;
  todayCustomersCount: number;
  pendingOrdersCount: number;
  outOfStockCount: number;
  lowStockCount: number;
}

export interface DashboardTopProduct {
  id: string;
  name: string;
  totalQuantity: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: Date;
  customerName: string;
}

export interface DashboardRecentActivity {
  id: string;
  orderNumber: string;
  status: string;
  note: string | null;
  createdAt: Date;
  creatorName: string;
}

export interface DashboardRecentPayment {
  id: string;
  orderNumber: string;
  total: number;
  paidAt: Date;
  customerName: string;
}

export interface DashboardStats extends DashboardKPIs {
  recentOrders: DashboardRecentOrder[];
  topProducts: DashboardTopProduct[];
  recentActivities: DashboardRecentActivity[];
  recentPayments: DashboardRecentPayment[];
}

// --- Admin Profile ---
// Assuming standard profile fields based on usage
export interface AdminProfile {
  id: string;
  email?: string;
  fullName: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  // Add other fields as necessary
}

// --- Category ---
export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  depth?: number; // Added by flattened view in some cases
}

export interface NewCategory {
  parentId?: string | null;
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  imageUrl?: string;
  isActive?: boolean;
}

// --- Product ---
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean | null;
  categoryName: string | null;
  basePrice: string | null; // Decimal string
  totalStock: number;
  minPrice: number;
  maxPrice: number;
  thumbnail: string;
  skus?: string | null;
  minLowStockThreshold?: number | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: string;
  costPrice: string | null;
  stockQuantity: number;
  stockType: string;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateProductVariant {
  name: string;
  sku: string;
  price: number;
  costPrice?: number;
  stockQuantity?: number;
  stockType?: string;
  images?: string[];
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string | null;
  basePrice?: number;
  isActive?: boolean;
  variants: CreateProductVariant[];
}

// --- Customer ---
export interface CustomerStatsItem {
  id: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  customerType: string | null;
  customerCode: string | null;
  avatarUrl: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  totalSpent: number;
  orderCount: number;
}

export interface CustomerDetailOrder {
  id: string;
  total: string | number;
  createdAt: Date;
  [key: string]: unknown;
}

export interface CustomerDetail {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  customerCode: string | null;
  customerType: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  orders: CustomerDetailOrder[];
}

export interface CreateCustomerData {
  fullName: string;
  phone?: string;
  address?: string;
  customerType: string;
}

export interface UpdateCustomerData {
  fullName?: string;
  phone?: string;
  address?: string;
  customerType?: string;
  isActive?: boolean;
}

// --- Supplier ---
// From supplier-management.server.ts
export interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  paymentTerms: string | null;
  note: string | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  totalOrders: number;
}

export type SupplierLookupItem = Pick<Supplier, "id" | "code" | "name">;

export interface SupplierStats {
  totalOrders: number;
  pendingOrders: number;
  orderedOrders: number;
  receivedOrders: number;
  cancelledOrders: number;
  totalCost: number;
  recentOrders: Array<{
    id: string;
    status: string | null;
    quantity: number;
    actualCostPrice: string | null;
    createdAt: Date | null;
    orderedAt: Date | null;
    receivedAt: Date | null;
  }>;
}

export interface CreateSupplierData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  note?: string;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  isActive?: boolean;
}

// --- Chat ---
// From chat.server.ts
export interface ChatRoomCustomer {
  id: string;
  fullName: string | null;
  customerCode: string | null;
  phone: string | null;
  customerType: string | null;
}

export interface ChatRoomLastMessage {
  content: string | null;
  messageType: string | null;
  createdAt: Date | null;
  senderId: string;
  senderName: string | null;
}

export interface ChatRoomWithDetails {
  id: string;
  customer: ChatRoomCustomer;
  lastMessage: ChatRoomLastMessage | null;
  unreadCountAdmin: number;
  lastMessageAt: Date | null;
}

export interface ChatMessageSender {
  fullName: string | null;
  role: string | null;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: string | null;
  imageUrl: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
  sender: ChatMessageSender;
}

export interface AdminOrderListItem extends Order {
  customer: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  orderItems: (OrderItem & {
    productVariant: DBProductVariant & {
      product: any;
    };
  })[];
}

// --- Order Details ---
export interface AdminOrderDetails extends Order {
  customer: {
    fullName: string;
    customerCode: string;
    phone: string | null;
    address: string | null;
    avatarUrl: string | null;
  };
  items: (OrderItem & {
    variant: {
      images: { imageUrl: string }[];
    } | null;
  })[];
  payments: {
    id: string;
    createdAt: Date;
    method: string;
    referenceCode: string | null;
    note: string | null;
    amount: string;
    creator: {
      fullName: string | null;
    } | null;
  }[];
  statusHistory: {
    id: string;
    status: string;
    createdAt: Date;
    note: string | null;
    creator: {
      fullName: string | null;
    } | null;
  }[];
  parentOrder: {
    id: string;
    orderNumber: string;
  } | null;
  subOrders: {
    id: string;
    orderNumber: string;
    splitType: string | null;
    total: string;
    status: string;
  }[];
}

// --- Analytics ---
export interface AnalyticsMonthlyRevenue {
  month: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsCategorySale {
  category: string;
  sales: number;
  color?: string;
}

export interface AnalyticsTopProduct {
  name: string;
  sales: number;
  revenue: number;
  growth?: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
  monthlyRevenue: AnalyticsMonthlyRevenue[];
  categorySales: AnalyticsCategorySale[];
  topProducts: AnalyticsTopProduct[];
}

// --- Finance & Expenses ---
export interface FinancialStats {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  orderCount: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: string; // Decimal string from DB
  type: "fixed" | "variable";
  date: Date;
  createdBy: string;
  creator?: {
    id: string;
    fullName: string | null;
  };
}

export interface CreateExpenseData {
  description: string;
  amount: number;
  type: "fixed" | "variable";
  date: Date;
}
