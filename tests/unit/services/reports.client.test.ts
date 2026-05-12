import { beforeEach, describe, expect, it, vi } from "vitest";

const axiosMock = {
  get: vi.fn(),
  post: vi.fn(),
};

vi.mock("@workspace/shared/api-client", () => ({
  axios: axiosMock,
}));

describe("reports.client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches missing-cost P&L exceptions with date range and pagination", async () => {
    const { reportsClient } = await import("../../../apps/admin/services/reports.client");
    axiosMock.get.mockResolvedValue({ data: [], summary: {} });

    await reportsClient.getMissingCostOrders({
      startDate: "2026-05-01",
      endDate: "2026-05-12",
      search: "ORD-MISS",
      page: 2,
      limit: 20,
    });

    expect(axiosMock.get).toHaveBeenCalledWith("/api/admin/reports/profit-loss/missing-cost", {
      params: {
        startDate: "2026-05-01",
        endDate: "2026-05-12",
        search: "ORD-MISS",
        page: 2,
        limit: 20,
      },
    });
  });

  it("posts supplied unit cost for a missing-cost order line", async () => {
    const { reportsClient } = await import("../../../apps/admin/services/reports.client");
    axiosMock.post.mockResolvedValue({ success: true });

    await reportsClient.updateMissingCostOrderItem({
      orderId: "order-1",
      orderItemId: "item-1",
      unitCost: 80_000,
      note: "Bổ sung giá vốn",
      clientToken: "token-1",
    });

    expect(axiosMock.post).toHaveBeenCalledWith("/api/admin/orders/order-1/items/item-1/cost", {
      unitCost: 80_000,
      note: "Bổ sung giá vốn",
      clientToken: "token-1",
    });
  });
});
