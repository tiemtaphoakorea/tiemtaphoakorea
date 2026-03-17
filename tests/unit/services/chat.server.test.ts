import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  getChatMessages,
  getChatRoomByCustomerId,
  getChatRoomById,
  getChatRooms,
  getCustomerStatsForChat,
  getOrCreateChatRoom,
  getTotalUnreadCountForAdmin,
  markMessagesAsRead,
  sendMessage,
  uploadChatImage,
} from "@/services/chat.server";

// Create a self-referential chainable mock
function createChainableMock(defaultValue: any = []): any {
  const chainable: any = {};
  const methods = [
    "from",
    "where",
    "innerJoin",
    "leftJoin",
    "groupBy",
    "orderBy",
    "limit",
    "offset",
    "and",
    "returning",
    "values",
    "set",
  ];

  methods.forEach((method) => {
    chainable[method] = vi.fn().mockReturnValue(chainable);
  });

  // Make it thenable for await
  // biome-ignore lint/suspicious/noThenProperty: Intentionally making chainable mock thenable for async tests
  chainable.then = (resolve: any) => resolve(defaultValue);
  // Support map for iterating results
  chainable.map = (fn: any) => defaultValue.map(fn);

  return chainable;
}

// Mock dependencies
vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: { path: "test/path.jpg" }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/test/path.jpg" },
        }),
      }),
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      httpSend: vi.fn().mockResolvedValue({ success: true }),
    })),
  })),
}));

describe("Chat Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const mockDb = db as any;
    mockDb.select.mockImplementation(() => createChainableMock([]));
    mockDb.insert.mockImplementation(() => createChainableMock([{ id: "new-id" }]));
    mockDb.update.mockImplementation(() => createChainableMock());
  });

  describe("getChatRooms", () => {
    it("should return empty array when no rooms exist", async () => {
      const result = await getChatRooms();
      expect(result).toEqual([]);
    });

    it("should fetch rooms with customer info", async () => {
      const mockDb = db as any;
      const mockRooms = [
        {
          id: "room-1",
          customerId: "cust-1",
          unreadCountAdmin: 2,
          lastMessageAt: new Date(),
          customerFullName: "John Doe",
          customerCode: "KH001",
          customerPhone: "0123456789",
          customerType: "retail",
        },
      ];
      mockDb.select.mockImplementation(() => createChainableMock(mockRooms));

      const result = await getChatRooms();
      expect(mockDb.select).toHaveBeenCalled();
      expect(result.length).toBe(1);
    });

    it("should include last message when available", async () => {
      const mockDb = db as any;
      const room = {
        id: "room-1",
        customerId: "cust-1",
        unreadCountAdmin: 0,
        lastMessageAt: new Date(),
        customerFullName: "John Doe",
        customerCode: "KH001",
        customerPhone: "0123456789",
        customerType: "retail",
      };
      const lastMessage = {
        content: "Hello",
        messageType: "text",
        createdAt: new Date(),
        senderId: "admin-1",
        senderName: "Admin",
      };
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        return createChainableMock(callCount === 1 ? [room] : [lastMessage]);
      });

      const result = await getChatRooms();

      expect(result[0].lastMessage?.content).toBe("Hello");
      expect(result[0].lastMessage?.senderName).toBe("Admin");
    });

    it("should set last message to null when none exist", async () => {
      const mockDb = db as any;
      const room = {
        id: "room-1",
        customerId: "cust-1",
        unreadCountAdmin: 0,
        lastMessageAt: new Date(),
        customerFullName: "John Doe",
        customerCode: "KH001",
        customerPhone: "0123456789",
        customerType: "retail",
      };
      let callCount = 0;
      mockDb.select.mockImplementation(() => {
        callCount++;
        return createChainableMock(callCount === 1 ? [room] : []);
      });

      const result = await getChatRooms();
      expect(result[0].lastMessage).toBeNull();
    });
  });

  describe("getOrCreateChatRoom", () => {
    it("should return existing room id if room exists", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([{ id: "existing-room-id" }]));

      const result = await getOrCreateChatRoom("customer-id");
      expect(result).toBe("existing-room-id");
    });

    it("should create new room if none exists", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([]));
      mockDb.insert.mockImplementation(() => createChainableMock([{ id: "new-room-id" }]));

      const result = await getOrCreateChatRoom("customer-id");
      expect(result).toBe("new-room-id");
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe("getChatRoomById", () => {
    it("should return null if room not found", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([]));

      const result = await getChatRoomById("non-existent");
      expect(result).toBeNull();
    });

    it("should return room with customer details", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([
          {
            id: "room-1",
            customerId: "cust-1",
            unreadCountAdmin: 0,
            unreadCountCustomer: 0,
            customerFullName: "John",
            customerCode: "KH001",
            customerPhone: "0123",
            customerType: "retail",
          },
        ]),
      );

      const result = await getChatRoomById("room-1");
      expect(result).toBeDefined();
      expect(result?.customer.fullName).toBe("John");
    });
  });

  describe("getChatRoomByCustomerId", () => {
    it("should return room id if exists", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([{ id: "room-id" }]));

      const result = await getChatRoomByCustomerId("cust-1");
      expect(result).toBe("room-id");
    });

    it("should return null if no room exists", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([]));

      const result = await getChatRoomByCustomerId("cust-1");
      expect(result).toBeNull();
    });
  });

  describe("getChatMessages", () => {
    it("should return messages array", async () => {
      const mockDb = db as any;
      const mockMessages = [
        {
          id: "1",
          content: "Hello",
          senderId: "user-1",
          roomId: "room-1",
          senderFullName: "John",
          senderRole: "customer",
        },
      ];
      mockDb.select.mockImplementation(() => createChainableMock(mockMessages));

      const result = await getChatMessages("room-1");
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should support pagination", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([]));

      await getChatMessages("room-1", 10, 20);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it("should return messages in chronological order", async () => {
      const mockDb = db as any;
      const now = new Date();
      const older = new Date(now.getTime() - 1000);
      const mockMessages = [
        { id: "2", content: "Newer", createdAt: now, senderFullName: "A" },
        { id: "1", content: "Older", createdAt: older, senderFullName: "B" },
      ];
      mockDb.select.mockImplementation(() => createChainableMock(mockMessages));

      const result = await getChatMessages("room-1");
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");
    });
  });

  describe("sendMessage", () => {
    it("should throw error for empty text message", async () => {
      await expect(
        sendMessage({
          roomId: "room-1",
          senderId: "user-1",
          content: "",
          messageType: "text",
        }),
      ).rejects.toThrow("Vui lòng nhập tin nhắn");
    });

    it("should throw error for message exceeding 2000 characters", async () => {
      const longContent = "a".repeat(2001);
      await expect(
        sendMessage({
          roomId: "room-1",
          senderId: "user-1",
          content: longContent,
          messageType: "text",
        }),
      ).rejects.toThrow("Tin nhắn tối đa 2000 ký tự");
    });

    it("should create message for valid input from customer", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([{ role: "customer", fullName: "Customer" }]),
      );
      mockDb.insert.mockImplementation(() =>
        createChainableMock([
          {
            id: "msg-1",
            roomId: "room-1",
            senderId: "cust-1",
            content: "Hello",
            messageType: "text",
            imageUrl: null,
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      );

      const result = await sendMessage({
        roomId: "room-1",
        senderId: "cust-1",
        content: "Hello",
      });

      expect(result.id).toBe("msg-1");
      expect(mockDb.update).toHaveBeenCalled(); // Updates unreadCountAdmin
    });

    it("should create message from admin and increment customer unread count", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([{ role: "admin", fullName: "Admin" }]),
      );
      mockDb.insert.mockImplementation(() =>
        createChainableMock([
          {
            id: "msg-2",
            roomId: "room-1",
            senderId: "admin-1",
            content: "Reply from admin",
            messageType: "text",
            imageUrl: null,
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      );

      const result = await sendMessage({
        roomId: "room-1",
        senderId: "admin-1",
        content: "Reply from admin",
      });

      expect(result.id).toBe("msg-2");
      expect(result.sender.role).toBe("admin");
      expect(mockDb.update).toHaveBeenCalled(); // Updates unreadCountCustomer
    });

    it("should treat unknown sender as customer and increment admin unread count", async () => {
      const mockDb = db as any;
      const setCalls: any[] = [];
      mockDb.select.mockImplementation(() => createChainableMock([]));
      mockDb.insert.mockImplementation(() =>
        createChainableMock([
          {
            id: "msg-4",
            roomId: "room-1",
            senderId: "unknown",
            content: "Hi",
            messageType: "text",
            imageUrl: null,
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      );
      mockDb.update.mockImplementation(() => ({
        set: (values: any) => {
          setCalls.push(values);
          return { where: vi.fn().mockResolvedValue([]) };
        },
      }));

      const result = await sendMessage({
        roomId: "room-1",
        senderId: "unknown",
        content: "Hi",
      });

      expect(result.id).toBe("msg-4");
      expect(setCalls[0]).toHaveProperty("unreadCountAdmin");
    });

    it("should handle image message type", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([{ role: "customer", fullName: "Customer" }]),
      );
      mockDb.insert.mockImplementation(() =>
        createChainableMock([
          {
            id: "msg-3",
            roomId: "room-1",
            senderId: "cust-1",
            content: "[Hình ảnh]",
            messageType: "image",
            imageUrl: "https://example.com/image.jpg",
            isRead: false,
            createdAt: new Date(),
          },
        ]),
      );

      const result = await sendMessage({
        roomId: "room-1",
        senderId: "cust-1",
        content: "",
        messageType: "image",
        imageUrl: "https://example.com/image.jpg",
      });

      expect(result.messageType).toBe("image");
    });
  });

  describe("markMessagesAsRead", () => {
    it("should mark messages as read for admin reader", async () => {
      const mockDb = db as any;
      const setCalls: any[] = [];
      mockDb.select.mockImplementation(() => createChainableMock([{ role: "staff" }]));
      mockDb.update.mockImplementation(() => ({
        set: (values: any) => {
          setCalls.push(values);
          return { where: vi.fn().mockResolvedValue([]) };
        },
      }));

      await markMessagesAsRead("room-1", "admin-1");

      expect(mockDb.update).toHaveBeenCalled();
      expect(setCalls[1]).toEqual({ unreadCountAdmin: 0 });
    });

    it("should reset unreadCountCustomer for customer reader", async () => {
      const mockDb = db as any;
      const setCalls: any[] = [];
      mockDb.select.mockImplementation(() => createChainableMock([{ role: "customer" }]));
      mockDb.update.mockImplementation(() => ({
        set: (values: any) => {
          setCalls.push(values);
          return { where: vi.fn().mockResolvedValue([]) };
        },
      }));

      await markMessagesAsRead("room-1", "customer-1");

      expect(mockDb.update).toHaveBeenCalled();
      expect(setCalls[1]).toEqual({ unreadCountCustomer: 0 });
    });
  });

  describe("getTotalUnreadCountForAdmin", () => {
    it("should return total unread count", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([{ total: 5 }]));

      const result = await getTotalUnreadCountForAdmin();
      expect(result).toBe(5);
    });

    it("should return 0 when no unread messages", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() => createChainableMock([{ total: 0 }]));

      const result = await getTotalUnreadCountForAdmin();
      expect(result).toBe(0);
    });
  });

  describe("getCustomerStatsForChat", () => {
    it("should return customer stats", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([
          {
            totalOrders: 10,
            totalSpent: 1000000,
            lastOrderDate: new Date("2024-01-01"),
          },
        ]),
      );

      const result = await getCustomerStatsForChat("cust-1");

      expect(result.totalOrders).toBe(10);
      expect(result.totalSpent).toBe(1000000);
    });

    it("should return default values when no orders", async () => {
      const mockDb = db as any;
      mockDb.select.mockImplementation(() =>
        createChainableMock([
          {
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
          },
        ]),
      );

      const result = await getCustomerStatsForChat("cust-1");

      expect(result.totalOrders).toBe(0);
      expect(result.totalSpent).toBe(0);
      expect(result.lastOrderDate).toBeNull();
    });
  });

  describe("uploadChatImage", () => {
    it("should throw error for invalid file type", async () => {
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await expect(uploadChatImage("room-1", file)).rejects.toThrow(
        "Chỉ hỗ trợ định dạng JPG, PNG, WebP",
      );
    });

    it("should throw error for file exceeding 5MB", async () => {
      const largeContent = new ArrayBuffer(6 * 1024 * 1024); // 6MB
      const file = new File([largeContent], "large.jpg", {
        type: "image/jpeg",
      });

      await expect(uploadChatImage("room-1", file)).rejects.toThrow("Kích thước file tối đa 5MB");
    });

    it("should upload valid image and return public URL", async () => {
      const file = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });

      const result = await uploadChatImage("room-1", file);

      expect(result).toBe("https://example.com/test/path.jpg");
    });

    it("should accept PNG files", async () => {
      const file = new File(["png content"], "test.png", { type: "image/png" });

      const result = await uploadChatImage("room-1", file);

      expect(result).toBe("https://example.com/test/path.jpg");
    });

    it("should accept WebP files", async () => {
      const file = new File(["webp content"], "test.webp", {
        type: "image/webp",
      });

      const result = await uploadChatImage("room-1", file);

      expect(result).toBe("https://example.com/test/path.jpg");
    });

    it("should throw error when upload fails", async () => {
      const { createClient } = await import("@/lib/supabase/server");
      vi.mocked(createClient).mockResolvedValueOnce({
        storage: {
          from: vi.fn().mockReturnValue({
            upload: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Storage quota exceeded" },
            }),
            getPublicUrl: vi.fn(),
          }),
        },
      } as any);

      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });

      await expect(uploadChatImage("room-1", file)).rejects.toThrow(
        "Upload thất bại: Storage quota exceeded",
      );
    });
  });
});
