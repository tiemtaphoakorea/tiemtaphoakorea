import type { StockAlertVariant } from "@workspace/database/services/analytics.server";
import type { DailyStatRow, DayOrderRow } from "@workspace/database/services/finance.server";
import type {
  AdminOrderDetails,
  AdminProfile,
  AnalyticsData,
  Category,
  CategoryWithChildren,
  ChatRoomWithDetails,
  CreateCustomerData,
  CreateProductData,
  CreateSupplierData,
  CustomerDebtResponse,
  CustomerStatsItem,
  DashboardKPIs,
  DashboardRecentOrder,
  DashboardTopProduct,
  DebtListItem,
  Expense,
  FinancialStats,
  NewCategory,
  CreateExpenseData as NewExpenseData,
  ProductListItem,
  Supplier,
  UpdateCustomerData,
  UpdateSupplierData,
} from "@workspace/database/types/admin";
import type {
  ChatMessage,
  ProductResponse,
  ProductWithVariants,
  UserProfileResponse,
} from "@workspace/database/types/api";
import type { Order } from "@workspace/database/types/order";
import { axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import {
  ADMIN_STATS_SECTION,
  type FulfillmentStatusValue,
  type PaymentStatusValue,
} from "@workspace/shared/constants";
import type { PaginatedResponse } from "@workspace/shared/pagination";
import type { LoginFormValues } from "@workspace/shared/schemas";

export type { DailyStatRow, DayOrderRow, StockAlertVariant };

export type InventoryMovement = {
  id: string;
  variantId: string;
  variantSku: string;
  variantName: string;
  type: "stock_out" | "supplier_receipt" | "manual_adjustment" | "cancellation";
  quantity: number;
  onHandBefore: number;
  onHandAfter: number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type BannerAdminItem = {
  id: string;
  type: "custom" | "category";
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  badgeText: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  discountTag: string | null;
  discountTagSub: string | null;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type DailySummaryRow = {
  date: string;
  totalIn: number;
  totalOut: number;
};

/**
 * Service for client-side admin API calls.
 */
export const adminClient = {
  /**
   * Fetch current admin profile.
   */
  async getProfile() {
    return axios.get<AdminProfile>(API_ENDPOINTS.ADMIN.PROFILE) as unknown as Promise<AdminProfile>;
  },

  async login(data: LoginFormValues) {
    return axios.post<{
      success: boolean;
      error?: string;
    }>(API_ENDPOINTS.ADMIN.LOGIN, data) as unknown as Promise<{
      success: boolean;
      error?: string;
    }>;
  },

  /**
   * Logout admin.
   */
  async logout() {
    return axios.post<void>(API_ENDPOINTS.ADMIN.LOGOUT) as unknown as Promise<void>;
  },

  async getDashboardKPIs() {
    return axios.get<{ kpiStats: DashboardKPIs }>(API_ENDPOINTS.ADMIN.STATS, {
      params: { section: ADMIN_STATS_SECTION.KPI },
    }) as unknown as Promise<{ kpiStats: DashboardKPIs }>;
  },

  async getRecentOrders() {
    return axios.get<{ recentOrders: DashboardRecentOrder[] }>(API_ENDPOINTS.ADMIN.STATS, {
      params: { section: ADMIN_STATS_SECTION.RECENT_ORDERS },
    }) as unknown as Promise<{ recentOrders: DashboardRecentOrder[] }>;
  },

  async getTopProducts() {
    return axios.get<{ topProducts: DashboardTopProduct[] }>(API_ENDPOINTS.ADMIN.STATS, {
      params: { section: ADMIN_STATS_SECTION.TOP_PRODUCTS },
    }) as unknown as Promise<{ topProducts: DashboardTopProduct[] }>;
  },

  async getAnalytics() {
    return axios.get<AnalyticsData>(
      API_ENDPOINTS.ADMIN.ANALYTICS,
    ) as unknown as Promise<AnalyticsData>;
  },

  async getStockAlerts() {
    return axios.get<{ lowStock: StockAlertVariant[]; outOfStock: StockAlertVariant[] }>(
      API_ENDPOINTS.ADMIN.STOCK_ALERTS,
    ) as unknown as Promise<{ lowStock: StockAlertVariant[]; outOfStock: StockAlertVariant[] }>;
  },

  /**
   * Fetch chat rooms and unread count (filter by search on backend).
   */
  async getChatRooms(params?: { search?: string }) {
    const response = (await axios.get<{ rooms: ChatRoomWithDetails[] }>(
      API_ENDPOINTS.ADMIN.CHAT.ROOMS,
      { params },
    )) as unknown as { rooms: ChatRoomWithDetails[] };
    return response.rooms || [];
  },

  /**
   * Fetch chat messages for a room.
   * Note: The API endpoint uses ?roomId=... which returns { messages: ... }
   */
  async getChatMessages(roomId: string) {
    return axios.get<{ messages: ChatMessage[] }>(
      API_ENDPOINTS.ADMIN.CHAT.DETAILS(roomId),
    ) as unknown as Promise<{ messages: ChatMessage[] }>;
  },

  async sendChatMessage(data: { roomId: string; content: string }) {
    return axios.post<{ success: boolean; message: ChatMessage }>(
      API_ENDPOINTS.ADMIN.CHAT.ROOMS,
      data,
    ) as unknown as Promise<{ success: boolean; message: ChatMessage }>;
  },

  async uploadChatImage(payload: { roomId: string; file: File }) {
    const formData = new FormData();
    formData.append("roomId", payload.roomId);
    formData.append("file", payload.file);
    formData.append("sendAsMessage", "true");
    return axios.post<{ success: boolean; url: string; message: ChatMessage }>(
      API_ENDPOINTS.ADMIN.CHAT.ROOMS,
      formData,
    ) as unknown as Promise<{ success: boolean; url: string; message: ChatMessage }>;
  },

  /**
   * Fetch admin categories (tree + flat, for dropdowns).
   */
  async getCategories(params?: { search?: string }) {
    return axios.get<{
      categories: CategoryWithChildren[];
      flatCategories: CategoryWithChildren[];
    }>(API_ENDPOINTS.ADMIN.CATEGORIES, { params }) as unknown as Promise<{
      categories: CategoryWithChildren[];
      flatCategories: CategoryWithChildren[];
    }>;
  },

  /**
   * Paginated flat category list for the admin list view.
   */
  async getCategoriesList(params?: { search?: string; page?: number; limit?: number }) {
    return axios.get<PaginatedResponse<CategoryWithChildren>>(API_ENDPOINTS.ADMIN.CATEGORIES, {
      params,
    }) as unknown as Promise<PaginatedResponse<CategoryWithChildren>>;
  },

  /**
   * Create a new category.
   */
  async createCategory(data: NewCategory) {
    return axios.post<Category>(
      API_ENDPOINTS.ADMIN.CATEGORIES,
      data,
    ) as unknown as Promise<Category>;
  },

  /**
   * Update a category.
   */
  async updateCategory(id: string, data: Partial<NewCategory>) {
    return axios.put<Category>(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`,
      data,
    ) as unknown as Promise<Category>;
  },

  /**
   * Delete a category.
   */
  async deleteCategory(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  /**
   * Fetch admin products.
   */
  async getProducts(params?: {
    search?: string;
    page?: number;
    limit?: number;
    stockStatus?: string;
  }) {
    return axios.get<PaginatedResponse<ProductListItem>>(API_ENDPOINTS.ADMIN.PRODUCTS, {
      params,
    }) as unknown as Promise<PaginatedResponse<ProductListItem>>;
  },

  async getProductsWithVariants() {
    return axios.get<{ products: ProductWithVariants[] }>(API_ENDPOINTS.ADMIN.PRODUCTS, {
      params: { include: "variants" },
    }) as unknown as Promise<{ products: ProductWithVariants[] }>;
  },

  /**
   * Fetch admin orders.
   */
  async createOrder(data: {
    customerId?: string;
    customerPhone?: string;
    customerName?: string;
    items: Array<{ variantId: string; quantity: number; customPrice?: number }>;
    note?: string;
    deliveryPreference?: string;
    shippingName?: string;
    shippingPhone?: string;
    shippingAddress?: string;
    shippingFee?: number;
  }) {
    return axios.post<{ success: boolean; order: Order }>(
      API_ENDPOINTS.ADMIN.ORDERS,
      data,
    ) as unknown as Promise<{ success: boolean; order: Order }>;
  },

  async getOrders(params?: {
    search?: string;
    paymentStatus?: PaymentStatusValue;
    fulfillmentStatus?: FulfillmentStatusValue;
    customerId?: string;
    debtOnly?: boolean;
    page?: number;
    limit?: number;
  }) {
    return axios.get<PaginatedResponse<Order>>(API_ENDPOINTS.ADMIN.ORDERS, {
      params,
    }) as unknown as Promise<PaginatedResponse<Order>>;
  },

  async getOrderStats() {
    return axios.get<{
      total: number;
      pending: number;
      completed: number;
      totalRevenue: number;
    }>(API_ENDPOINTS.ADMIN.ORDER_STATS) as unknown as Promise<{
      total: number;
      pending: number;
      completed: number;
      totalRevenue: number;
    }>;
  },

  async getOrder(id: string) {
    return axios.get<{ order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}`,
    ) as unknown as Promise<{ order: AdminOrderDetails }>;
  },

  async getCustomer(id: string) {
    return axios.get<{ customer: any }>(
      `${API_ENDPOINTS.ADMIN.CUSTOMERS}/${id}`,
    ) as unknown as Promise<{ customer: any }>;
  },

  async updateOrder(
    id: string,
    data: {
      adminNote?: string;
      discount?: number;
      items?: Array<{ variantId: string; quantity: number; customPrice?: number }>;
    },
  ) {
    return axios.put<{ success: boolean; order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}`,
      data,
    ) as unknown as Promise<{ success: boolean; order: AdminOrderDetails }>;
  },

  async deleteOrder(id: string) {
    return axios.delete<{ success?: boolean }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}`,
    ) as unknown as Promise<{ success?: boolean }>;
  },

  async stockOutOrder(id: string, data: { note?: string } = {}) {
    return axios.post<{ success: boolean; order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}/stock-out`,
      data,
    ) as unknown as Promise<{ success: boolean; order: AdminOrderDetails }>;
  },

  async completeOrder(id: string, data: { note?: string } = {}) {
    return axios.post<{ success: boolean; order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}/complete`,
      data,
    ) as unknown as Promise<{ success: boolean; order: AdminOrderDetails }>;
  },

  async cancelOrder(id: string, data: { note?: string } = {}) {
    return axios.post<{ success: boolean; order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}/cancel`,
      data,
    ) as unknown as Promise<{ success: boolean; order: AdminOrderDetails }>;
  },

  async getDebts(params?: { search?: string; minAgeDays?: number; page?: number; limit?: number }) {
    return axios.get<PaginatedResponse<DebtListItem>>(API_ENDPOINTS.ADMIN.DEBTS, {
      params,
    }) as unknown as Promise<PaginatedResponse<DebtListItem>>;
  },

  async getDebtSummary() {
    return axios.get<{ totalDebt: number; customerCount: number }>(
      API_ENDPOINTS.ADMIN.DEBT_SUMMARY,
    ) as unknown as Promise<{ totalDebt: number; customerCount: number }>;
  },

  async getCustomerDebt(customerId: string) {
    return axios.get<CustomerDebtResponse>(
      API_ENDPOINTS.ADMIN.DEBT_DETAIL(customerId),
    ) as unknown as Promise<CustomerDebtResponse>;
  },

  async recordOrderPayment(
    orderId: string,
    data: {
      amount: number;
      method: string;
      referenceCode?: string;
      note?: string;
    },
  ) {
    return axios.post<{ success?: boolean }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${orderId}/payments`,
      data,
    ) as unknown as Promise<{ success?: boolean }>;
  },

  /**
   * Delete a product.
   */
  async deleteProduct(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  /**
   * Delete multiple products in bulk.
   */
  async bulkDeleteProducts(ids: string[]) {
    return axios.delete<{ deleted: number; failed: string[] }>(API_ENDPOINTS.ADMIN.PRODUCTS, {
      data: { ids },
    }) as unknown as Promise<{ deleted: number; failed: string[] }>;
  },

  // Customer Management
  async getCustomerStats() {
    return axios.get<{
      total: number;
      withOrders: number;
      withoutOrders: number;
      totalSpent: number;
    }>(API_ENDPOINTS.ADMIN.CUSTOMER_STATS) as unknown as Promise<{
      total: number;
      withOrders: number;
      withoutOrders: number;
      totalSpent: number;
    }>;
  },

  async getCustomers(params?: {
    search?: string;
    status?: string;
    customerType?: string;
    page?: number;
    limit?: number;
  }) {
    return axios.get<PaginatedResponse<CustomerStatsItem>>(API_ENDPOINTS.ADMIN.CUSTOMERS, {
      params,
    }) as unknown as Promise<PaginatedResponse<CustomerStatsItem>>;
  },

  async createCustomer(data: CreateCustomerData) {
    return axios.post<{
      profile: CustomerStatsItem;
      password?: string;
      email?: string;
    }>(API_ENDPOINTS.ADMIN.CUSTOMERS, data) as unknown as Promise<{
      profile: CustomerStatsItem;
      password?: string;
      email?: string;
    }>;
  },

  async updateCustomer(id: string, data: UpdateCustomerData) {
    return axios.put<CustomerStatsItem>(
      `${API_ENDPOINTS.ADMIN.CUSTOMERS}/${id}`,
      data,
    ) as unknown as Promise<CustomerStatsItem>;
  },

  async toggleCustomerStatus(id: string, isActive: boolean) {
    return axios.patch<{ success: boolean; profile: CustomerStatsItem }>(
      `${API_ENDPOINTS.ADMIN.CUSTOMERS}/${id}/status`,
      {
        isActive,
      },
    ) as unknown as Promise<{ success: boolean; profile: CustomerStatsItem }>;
  },

  async getCustomerTierConfig() {
    return axios.get<{
      loyalMinOrders: number;
      loyalMinSpent: number;
      frequentMinOrders: number;
      frequentMinSpent: number;
    }>(API_ENDPOINTS.ADMIN.SETTINGS_CUSTOMER_TIER) as unknown as Promise<{
      loyalMinOrders: number;
      loyalMinSpent: number;
      frequentMinOrders: number;
      frequentMinSpent: number;
    }>;
  },

  async updateCustomerTierConfig(data: {
    loyalMinOrders: number;
    loyalMinSpent: number;
    frequentMinOrders: number;
    frequentMinSpent: number;
  }) {
    return axios.put<typeof data>(
      API_ENDPOINTS.ADMIN.SETTINGS_CUSTOMER_TIER,
      data,
    ) as unknown as Promise<typeof data>;
  },

  /**
   * Create a new product.
   */
  async createProduct(data: CreateProductData) {
    return axios.post<ProductResponse>(
      API_ENDPOINTS.ADMIN.PRODUCTS,
      data,
    ) as unknown as Promise<ProductResponse>;
  },

  async getProduct(id: string) {
    return axios.get<{ product: any }>(
      `${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`,
    ) as unknown as Promise<{ product: any }>;
  },

  async updateProduct(
    id: string,
    data: {
      name: string;
      slug?: string;
      description?: string;
      categoryId?: string | null;
      basePrice?: number;
      isActive?: boolean;
      variants?: Array<{ id?: string; [key: string]: any }>;
    },
  ) {
    return axios.put<{ success: boolean; product: any }>(
      `${API_ENDPOINTS.ADMIN.PRODUCTS}/${id}`,
      data,
    ) as unknown as Promise<{ success: boolean; product: any }>;
  },

  // Supplier Management
  async getSuppliers(params?: { search?: string; page?: number; limit?: number }) {
    return axios.get<PaginatedResponse<Supplier>>(API_ENDPOINTS.ADMIN.SUPPLIERS, {
      params,
    }) as unknown as Promise<PaginatedResponse<Supplier>>;
  },

  async createSupplier(data: CreateSupplierData) {
    return axios.post<Supplier>(
      API_ENDPOINTS.ADMIN.SUPPLIERS,
      data,
    ) as unknown as Promise<Supplier>;
  },

  async updateSupplier(id: string, data: UpdateSupplierData) {
    return axios.put<Supplier>(
      `${API_ENDPOINTS.ADMIN.SUPPLIERS}/${id}`,
      data,
    ) as unknown as Promise<Supplier>;
  },

  async deleteSupplier(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.SUPPLIERS}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  // Finance & Expenses
  async getFinancialStats(params: { month: number; year: number }) {
    return axios.get<{ stats: FinancialStats }>(API_ENDPOINTS.ADMIN.FINANCE, {
      params,
    }) as unknown as Promise<{ stats: FinancialStats }>;
  },

  async getFinancialStatsByRange(params: { startDate: string; endDate: string }) {
    return axios.get<{ stats: FinancialStats }>(API_ENDPOINTS.ADMIN.FINANCE, {
      params,
    }) as unknown as Promise<{ stats: FinancialStats }>;
  },

  async getDayOrders(date: string) {
    return axios.get<{ orders: DayOrderRow[] }>(
      API_ENDPOINTS.ADMIN.FINANCE_DAY_ORDERS(date),
    ) as unknown as Promise<{ orders: DayOrderRow[] }>;
  },

  async getDailyFinancialStats(params: { startDate: string; endDate: string }) {
    return axios.get<{
      dailyData: DailyStatRow[];
      summary: { revenue: number; cogs: number; grossProfit: number; orderCount: number };
    }>(API_ENDPOINTS.ADMIN.FINANCE_DAILY, { params }) as unknown as Promise<{
      dailyData: DailyStatRow[];
      summary: { revenue: number; cogs: number; grossProfit: number; orderCount: number };
    }>;
  },

  async getExpenses(params: {
    month?: number;
    year?: number;
    type?: "fixed" | "variable";
    page?: number;
    limit?: number;
  }) {
    return axios.get<PaginatedResponse<Expense>>(API_ENDPOINTS.ADMIN.EXPENSES, {
      params,
    }) as unknown as Promise<PaginatedResponse<Expense>>;
  },

  async createExpense(data: NewExpenseData) {
    return axios.post<Expense>(API_ENDPOINTS.ADMIN.EXPENSES, data) as unknown as Promise<Expense>;
  },

  async deleteExpense(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.EXPENSES}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  // Users Management (paginated; filter on backend)
  async getUsers(params?: { search?: string; page?: number; limit?: number }) {
    return axios.get<PaginatedResponse<AdminProfile>>(API_ENDPOINTS.ADMIN.USERS, {
      params,
    }) as unknown as Promise<PaginatedResponse<AdminProfile>>;
  },

  async createUser(data: { fullName: string; username: string; phone?: string; role: string }) {
    // Axios interceptor returns response.data, so res is already the response body
    const res = await axios.post<UserProfileResponse & { success: boolean }>(
      API_ENDPOINTS.ADMIN.USERS,
      data,
    );
    return res as unknown as UserProfileResponse & { success: boolean };
  },

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    },
  ) {
    return axios.put(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, data);
  },

  async toggleUserStatus(id: string, isActive: boolean) {
    return axios.put(`${API_ENDPOINTS.ADMIN.USERS}/${id}`, { isActive });
  },

  async deleteUser(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.USERS}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  async deleteCustomer(id: string) {
    return axios.delete<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.CUSTOMERS}/${id}`,
    ) as unknown as Promise<{ success: boolean }>;
  },

  async resetUserPassword(id: string) {
    // Axios interceptor returns response.data, so res is already the response body
    const res = await axios.post<
      UserProfileResponse & {
        success: boolean;
        newPassword: string;
      }
    >(`${API_ENDPOINTS.ADMIN.USERS}/${id}/reset-password`);
    return res as unknown as UserProfileResponse & {
      success: boolean;
      newPassword: string;
    };
  },

  // Supplier Orders
  async getSupplierOrders(params?: { search?: string; status?: string }) {
    return axios.get<any[]>(API_ENDPOINTS.ADMIN.SUPPLIER_ORDERS, {
      params,
    }) as unknown as Promise<any[]>;
  },

  async createSupplierOrder(data: any) {
    return axios.post<any>(API_ENDPOINTS.ADMIN.SUPPLIER_ORDERS, data) as unknown as Promise<any>;
  },

  async updateSupplierOrderStatus(id: string, data: any) {
    return axios.patch<any>(
      API_ENDPOINTS.ADMIN.SUPPLIER_ORDER_DETAIL(id),
      data,
    ) as unknown as Promise<any>;
  },

  async getInventoryMovements(params?: {
    variantId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    return axios.get<{
      data: InventoryMovement[];
      metadata: { total: number; page: number; totalPages: number };
    }>(API_ENDPOINTS.ADMIN.INVENTORY.MOVEMENTS, { params }) as unknown as Promise<{
      data: InventoryMovement[];
      metadata: { total: number; page: number; totalPages: number };
    }>;
  },

  async getInventoryDailySummary(params?: {
    variantId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return axios.get<{ data: DailySummaryRow[] }>(API_ENDPOINTS.ADMIN.INVENTORY.DAILY_SUMMARY, {
      params,
    }) as unknown as Promise<{ data: DailySummaryRow[] }>;
  },

  async adjustInventory(body: { variantId: string; quantity: number; note?: string }) {
    return axios.post<InventoryMovement>(
      API_ENDPOINTS.ADMIN.INVENTORY.ADJUST,
      body,
    ) as unknown as Promise<InventoryMovement>;
  },

  // Banners
  async listBanners() {
    return axios.get<{ banners: BannerAdminItem[] }>(
      API_ENDPOINTS.ADMIN.BANNERS,
    ) as unknown as Promise<{ banners: BannerAdminItem[] }>;
  },

  async createBanner(data: Record<string, unknown>) {
    return axios.post<{ success: boolean; banner: BannerAdminItem }>(
      API_ENDPOINTS.ADMIN.BANNERS,
      data,
    ) as unknown as Promise<{ success: boolean; banner: BannerAdminItem }>;
  },

  async updateBanner(id: string, data: Record<string, unknown>) {
    return axios.patch<{ success: boolean; banner: BannerAdminItem }>(
      API_ENDPOINTS.ADMIN.BANNER_DETAIL(id),
      data,
    ) as unknown as Promise<{ success: boolean; banner: BannerAdminItem }>;
  },

  async deleteBanner(id: string) {
    return axios.delete<{ success: boolean }>(
      API_ENDPOINTS.ADMIN.BANNER_DETAIL(id),
    ) as unknown as Promise<{ success: boolean }>;
  },

  async reorderBanners(ids: string[]) {
    return axios.post<{ success: boolean }>(API_ENDPOINTS.ADMIN.BANNERS_REORDER, {
      ids,
    }) as unknown as Promise<{ success: boolean }>;
  },

  // Homepage Collections
  async listHomepageCollections() {
    return axios.get<{
      collections: Array<{
        id: string;
        type: "manual" | "best_sellers" | "new_arrivals" | "by_category";
        title: string;
        subtitle: string | null;
        iconKey: string | null;
        viewAllUrl: string | null;
        itemLimit: number;
        isActive: boolean;
        sortOrder: number;
        categoryId: string | null;
        daysWindow: number | null;
        productCount: number;
      }>;
    }>(API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTIONS) as unknown as Promise<{
      collections: Array<{
        id: string;
        type: "manual" | "best_sellers" | "new_arrivals" | "by_category";
        title: string;
        subtitle: string | null;
        iconKey: string | null;
        viewAllUrl: string | null;
        itemLimit: number;
        isActive: boolean;
        sortOrder: number;
        categoryId: string | null;
        daysWindow: number | null;
        productCount: number;
      }>;
    }>;
  },

  async getHomepageCollection(id: string) {
    return axios.get<{ collection: Record<string, unknown> }>(
      API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTION_DETAIL(id),
    ) as unknown as Promise<{ collection: Record<string, unknown> }>;
  },

  async createHomepageCollection(payload: Record<string, unknown>) {
    return axios.post<{ success: boolean; collection: Record<string, unknown> }>(
      API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTIONS,
      payload,
    ) as unknown as Promise<{ success: boolean; collection: Record<string, unknown> }>;
  },

  async updateHomepageCollection(id: string, payload: Record<string, unknown>) {
    return axios.patch<{ success: boolean; collection: Record<string, unknown> }>(
      API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTION_DETAIL(id),
      payload,
    ) as unknown as Promise<{ success: boolean; collection: Record<string, unknown> }>;
  },

  async deleteHomepageCollection(id: string) {
    return axios.delete<{ success: boolean }>(
      API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTION_DETAIL(id),
    ) as unknown as Promise<{ success: boolean }>;
  },

  async reorderHomepageCollections(ids: string[]) {
    return axios.post<{ success: boolean }>(API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTIONS_REORDER, {
      ids,
    }) as unknown as Promise<{ success: boolean }>;
  },

  async setHomepageCollectionProducts(id: string, productIds: string[]) {
    return axios.put<{ success: boolean }>(API_ENDPOINTS.ADMIN.HOMEPAGE_COLLECTION_PRODUCTS(id), {
      productIds,
    }) as unknown as Promise<{ success: boolean }>;
  },
};
