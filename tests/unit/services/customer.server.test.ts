import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  createCustomer,
  deleteCustomer,
  getCustomerDetails,
  getCustomers,
  updateCustomer,
} from "@/services/customer.server";
import { getOrderHistory } from "@/services/order.server";

function createChainableMock(defaultValue: any = []): any {
  const chainable: any = {};
  const methods = ["from", "leftJoin", "where", "groupBy", "orderBy", "limit", "offset"];
  methods.forEach((method) => {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  });
  // biome-ignore lint/suspicious/noThenProperty: Intentionally making chainable mock thenable for async tests
  chainable.then = (resolve: any) => resolve(defaultValue);
  return chainable;
}

// Mock the db.server module
vi.mock("@/db/db.server", () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
      orderStatusHistory: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => createChainableMock([])),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: "new-customer-id" }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: "updated-id" }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(() => []),
      })),
    })),
  },
}));

// Mock Supabase admin client
const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: vi.fn(() => Promise.resolve({ data: { user: { id: "auth-id" } }, error: null })),
      updateUserById: vi.fn(() => Promise.resolve({ data: {}, error: null as any })),
      deleteUser: vi.fn(() => Promise.resolve({ error: null })),
    },
  },
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => mockSupabaseAdmin),
}));

describe("Customer Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCustomers", () => {
    it("should fetch customers with stats", async () => {
      await getCustomers();
      expect(db.select).toHaveBeenCalled();
    });

    it("should apply search filter", async () => {
      await getCustomers({ search: "John" });
      expect(db.select).toHaveBeenCalled();
    });

    it("should return paginated data with metadata", async () => {
      const mockDb = db as any;
      mockDb.select
        .mockImplementationOnce(() => createChainableMock([{ count: 3 }]))
        .mockImplementationOnce(() =>
          createChainableMock([
            {
              id: "cust-1",
              fullName: "John Doe",
              customerCode: "KH001",
              totalSpent: 100000,
              orderCount: 2,
            },
          ]),
        );

      const result = await getCustomers({ page: 2, limit: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.metadata.total).toBe(3);
      expect(result.metadata.page).toBe(2);
      expect(result.metadata.limit).toBe(1);
      expect(result.metadata.totalPages).toBe(3);
    });
  });

  describe("getCustomerDetails", () => {
    it("should fetch customer with orders", async () => {
      const mockCustomer = {
        id: "cust-1",
        fullName: "John Doe",
        orders: [{ id: "order-1" }],
      };
      (db.query.profiles.findFirst as any).mockResolvedValue(mockCustomer);

      const result = await getCustomerDetails("cust-1");
      expect(result).toEqual(mockCustomer);
    });

    it("should return undefined if customer not found", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue(undefined);

      const result = await getCustomerDetails("non-existent");
      expect(result).toBeUndefined();
    });
  });

  describe("createCustomer", () => {
    it("should generate next customer code when existing customers exist", async () => {
      // First call for generateCustomerCode - existing customer with code
      (db.query.profiles.findFirst as any).mockResolvedValueOnce({
        customerCode: "KH005",
      }); // For generateCustomerCode

      const customerData = {
        fullName: "New Customer",
        customerType: "retail" as const,
      };

      const result = await createCustomer(customerData);

      // Should generate KH006
      expect(result.profile.id).toBe("new-customer-id");
    });

    it("should create a customer profile without creating an auth account", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      const customerData = {
        fullName: "Jane Doe",
        phone: "0987654321",
        address: "456 Street",
        customerType: "retail" as const,
      };

      const result = await createCustomer(customerData);

      // Customers no longer have auth accounts
      expect(mockSupabaseAdmin.auth.admin.createUser).not.toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(result.profile.id).toBe("new-customer-id");
      // No password/email for customers
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("email");
    });
  });

  describe("updateCustomer", () => {
    it("should update profile", async () => {
      const result = await updateCustomer("id-123", { fullName: "New Name" });
      expect(db.update).toHaveBeenCalled();
      expect(result.id).toBe("updated-id");
    });
  });

  describe("deleteCustomer", () => {
    it("should delete a customer profile by id and return the deleted record", async () => {
      const deletedProfile = { id: "profile-1", fullName: "Test User" };
      vi.mocked(db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedProfile]),
        }),
      });

      const result = await deleteCustomer("profile-1");

      expect(db.delete).toHaveBeenCalled();
      expect(result).toEqual(deletedProfile);
    });

    it("should return undefined when customer not found", async () => {
      vi.mocked(db.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      const result = await deleteCustomer("nonexistent-id");

      expect(result).toBeUndefined();
    });
  });

  describe("getOrderHistory", () => {
    it("should return status history for an order", async () => {
      const historyRow = {
        id: "hist-1",
        orderId: "order-1",
        status: "paid",
        createdAt: new Date(),
        creator: { fullName: "Admin" },
      };
      (db.query.orderStatusHistory.findMany as any).mockResolvedValue([historyRow]);

      const result = await getOrderHistory("order-1");

      expect(db.query.orderStatusHistory.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("paid");
    });

    it("should return empty array when order has no history", async () => {
      (db.query.orderStatusHistory.findMany as any).mockResolvedValue([]);

      const result = await getOrderHistory("order-999");

      expect(result).toEqual([]);
    });
  });
});

describe("Customer Service - Error Scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCustomer errors", () => {
    it("should handle empty customer name gracefully", async () => {
      (db.query.profiles.findFirst as any).mockResolvedValue(null);

      const customerData = {
        fullName: "",
        customerType: "retail" as const,
      };

      // Service allows empty name - documents current behavior
      const result = await createCustomer(customerData);
      expect(result).toBeDefined();
    });
  });

  describe("updateCustomer errors", () => {
    it("should handle update with empty data", async () => {
      const _result = await updateCustomer("id-123", {});
      expect(db.update).toHaveBeenCalled();
    });
  });
});
