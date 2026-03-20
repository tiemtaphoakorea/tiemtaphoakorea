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
  CustomerStatsItem,
  DashboardKPIs,
  DashboardRecentOrder,
  DashboardStats,
  DashboardTopProduct,
  Expense,
  FinancialStats,
  NewCategory,
  CreateExpenseData as NewExpenseData,
  ProductListItem,
  Supplier,
  UpdateCustomerData,
  UpdateSupplierData,
} from "@repo/database/types/admin";
import type {
  ChatMessage,
  ProductResponse,
  ProductWithVariants,
  UserProfileResponse,
} from "@repo/database/types/api";
import type { Order } from "@repo/database/types/order";
import { axios } from "@repo/shared/api-client";
import { API_ENDPOINTS } from "@repo/shared/api-endpoints";
import { ADMIN_STATS_SECTION } from "@repo/shared/constants";
import type { PaginatedResponse } from "@repo/shared/pagination";
import type { LoginFormValues } from "@repo/shared/schemas";

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
      access_token?: string;
    }>(API_ENDPOINTS.ADMIN.LOGIN, data) as unknown as Promise<{
      success: boolean;
      error?: string;
      access_token?: string;
    }>;
  },

  /**
   * Logout admin.
   */
  async logout() {
    return axios.post<void>(API_ENDPOINTS.ADMIN.LOGOUT) as unknown as Promise<void>;
  },

  /**
   * Fetch admin dashboard statistics.
   */
  async getStats() {
    return axios.get<{ stats: DashboardStats }>(API_ENDPOINTS.ADMIN.STATS) as unknown as Promise<{
      stats: DashboardStats;
    }>;
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

  /**
   * Fetch chat room details.
   */
  async getChatRoomDetails(roomId: string) {
    return axios.get<ChatRoomWithDetails>(
      API_ENDPOINTS.ADMIN.CHAT.DETAILS(roomId),
    ) as unknown as Promise<ChatRoomWithDetails>;
  },

  /**
   * Fetch admin categories.
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
    items: { variantId: string; quantity: number }[];
    note?: string;
    deliveryPreference?: string;
  }) {
    return axios.post<{ success: boolean; order: Order }>(
      API_ENDPOINTS.ADMIN.ORDERS,
      data,
    ) as unknown as Promise<{ success: boolean; order: Order }>;
  },

  async getOrders(params?: { search?: string; status?: string; page?: number; limit?: number }) {
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

  async updateOrder(id: string, data: { adminNote?: string; discount?: number }) {
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

  async updateOrderStatus(id: string, data: { status: string; note?: string }) {
    return axios.patch<{ success: boolean; order: AdminOrderDetails }>(
      `${API_ENDPOINTS.ADMIN.ORDERS}/${id}/status`,
      data,
    ) as unknown as Promise<{ success: boolean; order: AdminOrderDetails }>;
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
  async getCustomers(params?: { search?: string; status?: string; page?: number; limit?: number }) {
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

  async resetCustomerPassword(id: string) {
    return axios.post<{ newPassword: string }>(
      `${API_ENDPOINTS.ADMIN.CUSTOMERS}/${id}/reset-password`,
    ) as unknown as Promise<{ newPassword: string }>;
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

  // Supplier Management
  async getSuppliers(params?: { search?: string }) {
    return axios.get<{ suppliers: Supplier[] }>(API_ENDPOINTS.ADMIN.SUPPLIERS, {
      params,
    }) as unknown as Promise<{ suppliers: Supplier[] }>;
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
};
