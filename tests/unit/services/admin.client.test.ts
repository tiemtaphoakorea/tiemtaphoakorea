import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { ADMIN_STATS_SECTION } from "@/lib/constants";

const axiosMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/api-client", () => ({
  axios: axiosMock,
}));

describe("admin.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Profile & Auth", () => {
    it("should fetch admin profile", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ id: "u1", fullName: "Admin" });

      await adminClient.getProfile();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.PROFILE);
    });

    it("should logout", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.post.mockResolvedValue(undefined);

      await adminClient.logout();

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.LOGOUT);
    });
  });

  describe("Dashboard Stats", () => {
    it("should fetch full stats", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ stats: {} });

      await adminClient.getStats();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.STATS);
    });

    it("should return stats with totalRevenue from getStats response", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const mockStats = { totalRevenue: 5000, totalOrders: 12 };
      axiosMock.get.mockResolvedValue({ stats: mockStats });

      const result = await adminClient.getStats();

      expect((result as any).stats.totalRevenue).toBe(5000);
      expect((result as any).stats.totalOrders).toBe(12);
    });

    it("should call stats endpoint for KPIs", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ kpiStats: {} });

      await adminClient.getDashboardKPIs();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.STATS, {
        params: { section: ADMIN_STATS_SECTION.KPI },
      });
    });

    it("should fetch recent orders", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ recentOrders: [] });

      await adminClient.getRecentOrders();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.STATS, {
        params: { section: ADMIN_STATS_SECTION.RECENT_ORDERS },
      });
    });

    it("should fetch top products", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ topProducts: [] });

      await adminClient.getTopProducts();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.STATS, {
        params: { section: ADMIN_STATS_SECTION.TOP_PRODUCTS },
      });
    });
  });

  describe("Chat", () => {
    it("should return chat rooms array", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ rooms: [{ id: "r1" }] });

      const rooms = await adminClient.getChatRooms();

      expect(rooms).toEqual([{ id: "r1" }]);
      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CHAT.ROOMS, {
        params: undefined,
      });
    });

    it("should fetch chat messages for room", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ messages: [] });

      await adminClient.getChatMessages("room-1");

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CHAT.DETAILS("room-1"));
    });

    it("should fetch chat room details", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ id: "room-1", messages: [] });

      await adminClient.getChatRoomDetails("room-1");

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CHAT.DETAILS("room-1"));
    });
  });

  describe("Categories", () => {
    it("should fetch categories with optional params", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ categories: [], flatCategories: [] });

      await adminClient.getCategories({ search: "food" });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CATEGORIES, {
        params: { search: "food" },
      });
    });

    it("should create category", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const payload = { name: "New" } as any;

      await adminClient.createCategory(payload);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CATEGORIES, payload);
    });

    it("should update category", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const payload = { name: "Updated" };

      await adminClient.updateCategory("cat-1", payload);

      expect(axiosMock.put).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.CATEGORIES}/cat-1`,
        payload,
      );
    });

    it("should delete category", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.delete.mockResolvedValue({ success: true });

      await adminClient.deleteCategory("cat-1");

      expect(axiosMock.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.CATEGORIES}/cat-1`);
    });
  });

  describe("Products", () => {
    it("should fetch products with params", async () => {
      const { adminClient } = await import("@/services/admin.client");

      await adminClient.getProducts({ search: "abc", page: 2, limit: 10 });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.PRODUCTS, {
        params: { search: "abc", page: 2, limit: 10 },
      });
    });

    it("should fetch products with variants", async () => {
      const { adminClient } = await import("@/services/admin.client");

      await adminClient.getProductsWithVariants();

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.PRODUCTS, {
        params: { include: "variants" },
      });
    });

    it("should create product", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const payload = { name: "Product A", slug: "product-a" } as any;

      await adminClient.createProduct(payload);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.PRODUCTS, payload);
    });

    it("should delete product", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.delete.mockResolvedValue({ success: true });

      await adminClient.deleteProduct("prod-1");

      expect(axiosMock.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.PRODUCTS}/prod-1`);
    });
  });

  describe("Orders", () => {
    it("should fetch orders with params", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ data: [], metadata: {} });

      await adminClient.getOrders({
        search: "ORD-1",
        status: "pending",
        page: 1,
        limit: 20,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.ORDERS, {
        params: { search: "ORD-1", status: "pending", page: 1, limit: 20 },
      });
    });

    it("should fetch single order", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ order: { id: "ord-1" } });

      await adminClient.getOrder("ord-1");

      expect(axiosMock.get).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.ORDERS}/ord-1`);
    });

    it("should update order", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { adminNote: "Note", discount: 10 };

      await adminClient.updateOrder("ord-1", data);

      expect(axiosMock.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.ORDERS}/ord-1`, data);
    });

    it("should delete order", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.delete.mockResolvedValue({ success: true });

      await adminClient.deleteOrder("ord-1");

      expect(axiosMock.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.ORDERS}/ord-1`);
    });

    it("should propagate axios error to caller", async () => {
      const { adminClient } = await import("@/services/admin.client");
      // Note: axiosMock bypasses the real ApiError interceptor (packages/shared/api-client.ts).
      // In production, callers receive ApiError, not a plain Error.
      axiosMock.get.mockRejectedValue(new Error("Network Error"));

      await expect(adminClient.getOrders({})).rejects.toThrow("Network Error");
    });

    it("should update order status", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { status: "paid", note: "Paid in full" };

      await adminClient.updateOrderStatus("ord-1", data);

      expect(axiosMock.patch).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.ORDERS}/ord-1/status`,
        data,
      );
    });

    it("should record order payment", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = {
        amount: 100,
        method: "cash",
        referenceCode: "REF-1",
        note: "Paid",
      };

      await adminClient.recordOrderPayment("ord-1", data);

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.ORDERS}/ord-1/payments`,
        data,
      );
    });
  });

  describe("Customers", () => {
    it("should fetch customers with params", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ data: [], metadata: {} });

      await adminClient.getCustomers({
        search: "John",
        status: "Active",
        page: 1,
        limit: 10,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CUSTOMERS, {
        params: { search: "John", status: "Active", page: 1, limit: 10 },
      });
    });

    it("should create customer", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { fullName: "John", phone: "090", customerType: "retail" };

      await adminClient.createCustomer(data);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.CUSTOMERS, data);
    });

    it("should update customer", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { fullName: "John Updated", phone: "091" };

      await adminClient.updateCustomer("cus-1", data);

      expect(axiosMock.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.CUSTOMERS}/cus-1`, data);
    });

    it("should toggle customer status", async () => {
      const { adminClient } = await import("@/services/admin.client");

      await adminClient.toggleCustomerStatus("cus1", false);

      expect(axiosMock.patch).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.CUSTOMERS}/cus1/status`, {
        isActive: false,
      });
    });

    it("should reset customer password", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.post.mockResolvedValue({ newPassword: "new123" });

      await adminClient.resetCustomerPassword("cus-1");

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.CUSTOMERS}/cus-1/reset-password`,
      );
    });
  });

  describe("Suppliers", () => {
    it("should fetch suppliers with optional search", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ suppliers: [] });

      await adminClient.getSuppliers({ search: "ABC" });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.SUPPLIERS, {
        params: { search: "ABC" },
      });
    });

    it("should create supplier", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { name: "Supplier A", contact: "contact" } as any;

      await adminClient.createSupplier(data);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.SUPPLIERS, data);
    });

    it("should update supplier", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { name: "Supplier B" };

      await adminClient.updateSupplier("sup-1", data);

      expect(axiosMock.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.SUPPLIERS}/sup-1`, data);
    });

    it("should delete supplier", async () => {
      const { adminClient } = await import("@/services/admin.client");

      await adminClient.deleteSupplier("sup1");

      expect(axiosMock.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.SUPPLIERS}/sup1`);
    });
  });

  describe("Finance & Expenses", () => {
    it("should fetch financial stats", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ stats: {} });

      await adminClient.getFinancialStats({ month: 1, year: 2025 });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.FINANCE, {
        params: { month: 1, year: 2025 },
      });
    });

    it("should fetch expenses with params", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({ data: [], metadata: {} });

      await adminClient.getExpenses({
        month: 1,
        year: 2025,
        type: "fixed",
        page: 1,
        limit: 10,
      });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.EXPENSES, {
        params: { month: 1, year: 2025, type: "fixed", page: 1, limit: 10 },
      });
    });

    it("should create expense", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { amount: 100, type: "fixed", note: "Rent" } as any;

      await adminClient.createExpense(data);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.EXPENSES, data);
    });

    it("should delete expense", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.delete.mockResolvedValue({ success: true });

      await adminClient.deleteExpense("exp-1");

      expect(axiosMock.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.EXPENSES}/exp-1`);
    });
  });

  describe("Users", () => {
    it("should fetch users with optional search and pagination", async () => {
      const { adminClient } = await import("@/services/admin.client");
      axiosMock.get.mockResolvedValue({
        data: [],
        metadata: { total: 0, page: 1, limit: 10, totalPages: 1 },
      });

      await adminClient.getUsers({ search: "admin", page: 1, limit: 10 });

      expect(axiosMock.get).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.USERS, {
        params: { search: "admin", page: 1, limit: 10 },
      });
    });

    it("should create user", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { fullName: "User", username: "user", role: "manager" };

      await adminClient.createUser(data);

      expect(axiosMock.post).toHaveBeenCalledWith(API_ENDPOINTS.ADMIN.USERS, data);
    });

    it("should update user", async () => {
      const { adminClient } = await import("@/services/admin.client");
      const data = { fullName: "Updated" };

      await adminClient.updateUser("user-1", data);

      expect(axiosMock.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.USERS}/user-1`, data);
    });

    it("should toggle user status", async () => {
      const { adminClient } = await import("@/services/admin.client");

      await adminClient.toggleUserStatus("user-1", false);

      expect(axiosMock.put).toHaveBeenCalledWith(`${API_ENDPOINTS.ADMIN.USERS}/user-1`, {
        isActive: false,
      });
    });

    it("should reset user password", async () => {
      const { adminClient } = await import("@/services/admin.client");
      // api-client interceptor returns response.data, so mock resolves with body directly
      axiosMock.post.mockResolvedValue({
        success: true,
        newPassword: "new123",
      });

      const result = await adminClient.resetUserPassword("user-1");

      expect(axiosMock.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.ADMIN.USERS}/user-1/reset-password`,
      );
      expect(result.newPassword).toBe("new123");
    });
  });
});
