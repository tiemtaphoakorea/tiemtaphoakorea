import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import { ORDER_STATUS } from "@/lib/constants";
import {
  createOrder,
  deleteOrder,
  getOrderStats,
  recordPayment,
  updateOrder,
} from "@/services/order.server";

vi.mock("@/services/order-split.server", () => ({
  createSplitOrders: vi.fn().mockResolvedValue({ id: "order-parent" }),
}));

// Mock DB with execute support for locking functions
vi.mock("@/db/db.server", () => ({
  db: {
    transaction: vi.fn((cb) =>
      cb({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      }),
    ),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    query: {
      orders: { findFirst: vi.fn() },
      orderItems: { findMany: vi.fn().mockResolvedValue([]) },
      orderStatusHistory: { findMany: vi.fn().mockResolvedValue([]) },
    },
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe("createOrder", () => {
  const mockTx: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));
    mockTx.where.mockReturnValue(mockTx);
    mockTx.execute.mockReset();
    mockTx.returning.mockReset();
    mockTx.returning.mockReturnValue(mockTx);
  });

  it("should create an order successfully with in-stock items", async () => {
    // Mock locked variants (reserve-stock model: onHand + reserved, no stockQuantity)
    mockTx.for.mockResolvedValueOnce([
      {
        id: "v1",
        productId: "p1",
        name: "Variant 1",
        sku: "SKU1",
        price: "100000",
        costPrice: "80000",
        onHand: 10,
        reserved: 0,
      },
    ]);

    // Mock generateOrderNumber (uses execute)
    mockTx.execute.mockResolvedValueOnce({
      rows: [{ order_number: "ORD-20260131-0001" }],
    });

    // Mock order insert
    mockTx.returning.mockResolvedValueOnce([{ id: "order-1" }]);

    // Mock items insert
    mockTx.returning.mockResolvedValueOnce([{ id: "item-1" }]);

    const result = await createOrder({
      customerId: "cust-1",
      items: [{ variantId: "v1", quantity: 2 }],
      userId: "admin-1",
    });

    // Check stock reservation (reserve-stock model increments `reserved`, not `stockQuantity`)
    expect(mockTx.update).toHaveBeenCalled();
    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        reserved: expect.anything(),
      }),
    );

    // Check order creation (createOrder returns { order, itemsNeedingStock })
    expect(result.order.id).toBe("order-1");
  });

  it("should create order when in_stock quantity insufficient (mixed: có món còn, có món hết; no supplier order)", async () => {
    mockTx.for.mockResolvedValueOnce([
      {
        id: "v1",
        productId: "p1",
        onHand: 1,
        reserved: 0,
        name: "V1",
        sku: "SKU1",
        price: "100",
        costPrice: "50",
      },
    ]);

    mockTx.execute.mockResolvedValueOnce({
      rows: [{ order_number: "ORD-20260131-0001" }],
    });

    mockTx.returning
      .mockResolvedValueOnce([{ id: "order-1" }])
      .mockResolvedValueOnce([{ id: "item-1" }]);

    const result = await createOrder({
      customerId: "cust-1",
      items: [{ variantId: "v1", quantity: 2 }], // Request 2, available 1 → deduct full 2 (stock -1), supplier order 1
      userId: "admin-1",
    });

    expect(result.order.id).toBe("order-1");
    expect(result.itemsNeedingStock).toHaveLength(1);
    expect(result.itemsNeedingStock![0]).toMatchObject({
      sku: "SKU1",
      quantityToOrder: 1,
    });
  });

  it("should create order for zero-stock items (deduct and report itemsNeedingStock)", async () => {
    mockTx.for.mockResolvedValueOnce([
      {
        id: "v2",
        productId: "p1",
        name: "Variant 2",
        price: "100",
        onHand: 0,
        reserved: 0,
        sku: "SKU2",
        costPrice: "50",
      },
    ]);

    mockTx.execute.mockResolvedValueOnce({
      rows: [{ order_number: "ORD-20260131-0001" }],
    });

    mockTx.returning.mockResolvedValueOnce([{ id: "order-2" }]);
    mockTx.returning.mockResolvedValueOnce([{ id: "item-2" }]);

    const result = await createOrder({
      customerId: "cust-1",
      items: [{ variantId: "v2", quantity: 5 }],
      userId: "admin-1",
    });

    expect(result.order).toBeDefined();
    // insert: Orders, OrderItems, StatusHistory, SupplierOrder
    expect(mockTx.insert).toHaveBeenCalledTimes(4);
  });
});

import { getOrderDetails, getOrders } from "@/services/order.server";

// Actually db.select...where is mocked.

describe("getOrders", () => {
  const createSelectMock = (rows: any[] = []) => {
    const selectMock: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      groupBy: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      // biome-ignore lint/suspicious/noThenProperty: Intentionally making chainable mock thenable for async tests
      then: (resolve: any) => resolve(rows),
    };
    return selectMock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter by customerId if provided", async () => {
    const totalMock = createSelectMock([{ count: 0 }]);
    const listMock = createSelectMock([]);
    (db.select as any)
      .mockImplementationOnce(() => totalMock)
      .mockImplementationOnce(() => listMock);

    await getOrders({ customerId: "cust-1" });
    expect(totalMock.where).toHaveBeenCalled();
  });

  it("should apply search filter", async () => {
    const totalMock = createSelectMock([{ count: 0 }]);
    const listMock = createSelectMock([]);
    (db.select as any)
      .mockImplementationOnce(() => totalMock)
      .mockImplementationOnce(() => listMock);

    await getOrders({ search: "ORD-001" });
    expect(totalMock.where).toHaveBeenCalled();
  });

  it("should apply status filter when not All", async () => {
    const totalMock = createSelectMock([{ count: 0 }]);
    const listMock = createSelectMock([]);
    (db.select as any)
      .mockImplementationOnce(() => totalMock)
      .mockImplementationOnce(() => listMock);

    await getOrders({ status: ORDER_STATUS.PENDING });
    expect(totalMock.where).toHaveBeenCalled();
  });

  it("should return mapped order results", async () => {
    const mockResults = [
      {
        id: "order-1",
        orderNumber: "ORD-001",
        status: "pending",
        total: "100000",
        createdAt: new Date(),
        paidAt: null,
        customerId: "cust-1",
        customerFullName: "John Doe",
        customerCode: "KH001",
        itemCount: 3,
      },
    ];
    const totalMock = createSelectMock([{ count: 1 }]);
    const listMock = createSelectMock(mockResults);
    (db.select as any)
      .mockImplementationOnce(() => totalMock)
      .mockImplementationOnce(() => listMock);

    const result = await getOrders();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].customer.fullName).toBe("John Doe");
    expect(result.metadata).toBeDefined();
  });
});

describe("getOrderDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return order with related data", async () => {
    const mockOrder = {
      id: "order-1",
      orderNumber: "ORD-001",
      status: "pending",
      customerId: "cust-1",
    };
    const mockCustomer = { id: "cust-1", fullName: "John" };
    const mockItems = [{ id: "item-1", productName: "Product A" }];
    const mockPayments: never[] = [];
    const mockHistory: never[] = [];

    // Mock db.select chain for order fetch
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValueOnce([mockOrder]).mockResolvedValueOnce([mockCustomer]),
    };
    (db.select as any).mockReturnValue(selectMock);

    (db.query.orderItems.findMany as any).mockResolvedValue(mockItems);
    (db.query.payments as any) = {
      findMany: vi.fn().mockResolvedValue(mockPayments),
    };
    (db.query.orderStatusHistory.findMany as any).mockResolvedValue(mockHistory);

    const result = await getOrderDetails("order-1");

    expect(db.select).toHaveBeenCalled();
    expect(result).toMatchObject({
      id: "order-1",
      orderNumber: "ORD-001",
      customer: mockCustomer,
      items: mockItems,
      statusHistory: mockHistory,
    });
  });

  it("should return null for non-existent order", async () => {
    // Mock db.select chain returning empty array
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    (db.select as any).mockReturnValue(selectMock);

    const result = await getOrderDetails("non-existent");

    expect(result).toBeNull();
  });
});

describe("createOrder - Error Scenarios", () => {
  const createMockTx = () => {
    const tx: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
      for: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    };
    tx.where.mockReturnValue(tx);
    tx.returning.mockResolvedValue([{ id: "order-1" }]);
    return tx;
  };

  let mockTx: ReturnType<typeof createMockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));
  });

  it("should throw error for non-existent variant", async () => {
    mockTx.for.mockResolvedValueOnce([]);

    await expect(
      createOrder({
        customerId: "cust-1",
        items: [{ variantId: "non-existent", quantity: 1 }],
        userId: "admin-1",
      }),
    ).rejects.toThrow("not found");
  });

  it("should handle order with single zero-stock item", async () => {
    mockTx.for.mockResolvedValueOnce([
      {
        id: "v1",
        productId: "p1",
        name: "Zero-stock Item",
        sku: "PRE1",
        price: "50000",
        costPrice: "30000",
        onHand: 0,
        reserved: 0,
      },
    ]);

    mockTx.execute.mockResolvedValueOnce({
      rows: [{ order_number: "ORD-20260131-0001" }],
    });

    mockTx.returning
      .mockResolvedValueOnce([{ id: "order-1" }]) // Order insert
      .mockResolvedValueOnce([{ id: "item-1" }]); // Item insert

    const result = await createOrder({
      customerId: "cust-1",
      items: [{ variantId: "v1", quantity: 1 }],
      userId: "admin-1",
    });

    expect(result.order.id).toBe("order-1");
  });

  it("should create split orders when ship available first", async () => {
    const orderSplit = await import("@/services/order-split.server");
    const createSplitOrdersSpy = vi.spyOn(orderSplit, "createSplitOrders").mockResolvedValue({
      order: { id: "parent-1", orderNumber: "ORD-001-1" } as any,
      itemsNeedingStock: [{ sku: "SKU2", name: "Pre-order", quantityToOrder: 2 }],
    });

    mockTx.for.mockResolvedValueOnce([
      {
        id: "v1",
        productId: "p1",
        name: "In-stock",
        sku: "SKU1",
        price: "100",
        costPrice: "80",
        onHand: 10,
        reserved: 0,
      },
      {
        id: "v2",
        productId: "p2",
        name: "Backorder",
        sku: "SKU2",
        price: "200",
        costPrice: "120",
        onHand: 0,
        reserved: 0,
      },
    ]);

    const result = await createOrder({
      customerId: "cust-1",
      items: [
        { variantId: "v1", quantity: 1 },
        { variantId: "v2", quantity: 2 },
      ],
      userId: "admin-1",
      deliveryPreference: "ship_available_first" as any,
    });

    expect(createSplitOrdersSpy).toHaveBeenCalled();
    expect(result.order).toBeDefined();
    expect(result.order.id).toBe("parent-1");
  });
});

describe("updateOrder", () => {
  const createMockTx = () => {
    const tx: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
    tx.where.mockReturnValue(tx);
    return tx;
  };

  let mockTx: ReturnType<typeof createMockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));
  });

  it("should update adminNote successfully", async () => {
    mockTx.where.mockResolvedValueOnce([{ id: "order-1", status: "pending", subtotal: "100000" }]);
    mockTx.returning.mockResolvedValueOnce([{ id: "order-1", adminNote: "New note" }]);

    const result = await updateOrder("order-1", { adminNote: "New note" }, "admin-1");

    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        adminNote: "New note",
      }),
    );
    expect(result.adminNote).toBe("New note");
  });

  it("should update discount and recalculate total", async () => {
    mockTx.where.mockResolvedValueOnce([{ id: "order-1", status: "pending", subtotal: "100000" }]);
    mockTx.returning.mockResolvedValueOnce([{ id: "order-1", discount: "10000", total: "90000" }]);

    await updateOrder("order-1", { discount: 10000 }, "admin-1");

    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        discount: "10000",
        total: "90000",
      }),
    );
  });

  it("should throw error if order not found", async () => {
    mockTx.where.mockResolvedValueOnce([]);

    await expect(updateOrder("non-existent", { adminNote: "test" }, "admin-1")).rejects.toThrow(
      "Order not found",
    );
  });

  it("should return current order if no updates provided", async () => {
    const current = {
      id: "order-1",
      status: "pending",
      subtotal: "100000",
    };
    mockTx.where.mockResolvedValueOnce([current]);

    const result = await updateOrder("order-1", {}, "admin-1");

    expect(result).toEqual(current);
    expect(mockTx.update).not.toHaveBeenCalled();
  });
});

describe("deleteOrder", () => {
  const createMockTx = () => {
    const tx: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
      for: vi.fn(),
      delete: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    };
    tx.where.mockReturnValue(tx);
    return tx;
  };

  let mockTx: ReturnType<typeof createMockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));
  });

  it("should throw error when trying to delete pending order", async () => {
    mockTx.for.mockResolvedValueOnce([
      { id: "order-1", orderNumber: "ORD-001", status: "pending" },
    ]);
    mockTx.where.mockReturnValue(mockTx);

    await expect(deleteOrder("order-1", "admin-1")).rejects.toThrow(
      "Only cancelled orders can be deleted",
    );
  });

  it("should delete cancelled order successfully", async () => {
    mockTx.for.mockResolvedValueOnce([
      { id: "order-1", orderNumber: "ORD-001", status: "cancelled" },
    ]);
    mockTx.where.mockReturnValue(mockTx); // lockOrder and delete; items not queried when cancelled

    const result = await deleteOrder("order-1", "admin-1");

    expect(result.success).toBe(true);
    expect(mockTx.delete).toHaveBeenCalled();
    expect(mockTx.update).not.toHaveBeenCalled();
  });

  it("should throw error for non-deletable status", async () => {
    mockTx.for.mockResolvedValueOnce([
      { id: "order-1", orderNumber: "ORD-001", status: "delivered" },
    ]);
    mockTx.where.mockReturnValue(mockTx);

    await expect(deleteOrder("order-1", "admin-1")).rejects.toThrow(
      'Cannot delete order with status "delivered"',
    );
  });

  it("should throw error if order not found", async () => {
    mockTx.for.mockResolvedValueOnce([]);
    mockTx.where.mockReturnValue(mockTx);

    await expect(deleteOrder("missing-order", "admin-1")).rejects.toThrow("Order not found");
  });
});

describe("recordPayment", () => {
  const createMockTx = () => {
    const tx: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockReturnThis(),
    };
    tx.where.mockReturnValue(tx);
    return tx;
  };

  let mockTx: ReturnType<typeof createMockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    (db.transaction as any).mockImplementation((cb: any) => cb(mockTx));

    // Mock db.select for pre-transaction check
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
    };
    (db.select as any).mockReturnValue(selectMock);
  });

  it("should record payment and update paidAmount", async () => {
    // Mock pre-transaction check
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "order-1" }]),
    };
    (db.select as any).mockReturnValue(selectMock);

    // Mock transaction query
    mockTx.where.mockResolvedValueOnce([
      { id: "order-1", total: "1000", paidAmount: "200", status: "pending" },
    ]);
    mockTx.returning.mockResolvedValueOnce([{ id: "order-1", paidAmount: "500" }]);

    const result = await recordPayment({
      orderId: "order-1",
      amount: 300,
      method: "cash" as any,
      userId: "admin-1",
    });

    expect(result.success).toBe(true);
    expect(mockTx.insert).toHaveBeenCalled();
    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paidAmount: "500",
      }),
    );
  });

  it("should auto-mark as paid when fully paid", async () => {
    // Mock pre-transaction check
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "order-1" }]),
    };
    (db.select as any).mockReturnValue(selectMock);

    // Mock transaction query
    mockTx.where.mockResolvedValueOnce([
      { id: "order-1", total: "1000", paidAmount: "700", status: "pending" },
    ]);
    mockTx.returning.mockResolvedValueOnce([{ id: "order-1", paidAmount: "1000", status: "paid" }]);

    await recordPayment({
      orderId: "order-1",
      amount: 300,
      method: "bank_transfer" as any,
      userId: "admin-1",
    });

    expect(mockTx.set).toHaveBeenCalledWith(
      expect.objectContaining({
        paidAmount: "1000",
        status: "paid",
        paidAt: expect.any(Date),
      }),
    );
    expect(mockTx.insert).toHaveBeenCalledTimes(2);
  });

  it("should throw error if order not found", async () => {
    // Mock pre-transaction check - order not found
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    (db.select as any).mockReturnValue(selectMock);

    await expect(
      recordPayment({
        orderId: "missing",
        amount: 100,
        method: "cash" as any,
        userId: "admin-1",
      }),
    ).rejects.toThrow("Order not found");
  });

  it("should throw INVALID_PAYMENT_AMOUNT for amount = 0", async () => {
    await expect(
      recordPayment({
        orderId: "order-1",
        amount: 0,
        method: "cash" as any,
        userId: "admin-1",
      }),
    ).rejects.toThrow("INVALID_PAYMENT_AMOUNT");
  });

  it("should throw INVALID_PAYMENT_AMOUNT for negative amount", async () => {
    await expect(
      recordPayment({
        orderId: "order-1",
        amount: -100,
        method: "cash" as any,
        userId: "admin-1",
      }),
    ).rejects.toThrow("INVALID_PAYMENT_AMOUNT");
  });

  it("should throw INVALID_PAYMENT_AMOUNT for NaN amount", async () => {
    await expect(
      recordPayment({
        orderId: "order-1",
        amount: Number.NaN,
        method: "cash" as any,
        userId: "admin-1",
      }),
    ).rejects.toThrow("INVALID_PAYMENT_AMOUNT");
  });

  it("should throw OVERPAYMENT_NOT_ALLOWED when payment exceeds remaining balance", async () => {
    // Mock pre-transaction check - order found
    const selectMock: any = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "order-1" }]),
    };
    (db.select as any).mockReturnValue(selectMock);

    // Mock transaction query - order with 800 paid of 1000 total
    mockTx.where.mockResolvedValueOnce([
      { id: "order-1", total: "1000", paidAmount: "800", status: "pending" },
    ]);

    // 800 + 300 = 1100 > 1000 → should throw OVERPAYMENT_NOT_ALLOWED
    await expect(
      recordPayment({
        orderId: "order-1",
        amount: 300,
        method: "cash" as any,
        userId: "admin-1",
      }),
    ).rejects.toThrow("OVERPAYMENT_NOT_ALLOWED");
  });
});

describe("getOrderStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return order statistics", async () => {
    const mockStats = {
      total: 10,
      pending: 4,
      completed: 3,
      totalRevenue: 2000000,
    };

    const selectMock: any = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockResolvedValue([mockStats]),
    };
    (db.select as any).mockImplementation(() => selectMock);

    const result = await getOrderStats();

    expect(db.select).toHaveBeenCalled();
    expect(result).toEqual(mockStats);
  });
});
