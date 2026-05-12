/**
 * R11: Idempotency on POST /api/admin/purchases/[id]/confirm and /cancel.
 *
 * confirm: only acts when status=DRAFT; retry after commit returns
 * "Chỉ confirm được đơn ở trạng thái nháp" — natural idempotency at the
 * service level. But mid-tx retry before commit can run twice; the
 * idempotency wrapper closes that window.
 *
 * cancel: same shape. Both share the wrapper with resourceType="purchase".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCheck, mockStore, mockUpdate } = vi.hoisted(() => ({
  mockCheck: vi.fn(),
  mockStore: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock("@workspace/database/lib/idempotency", () => ({
  checkIdempotencyKey: mockCheck,
  storeIdempotencyKey: mockStore,
  updateIdempotencyKey: mockUpdate,
  comparePayloads: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
}));

import { beginActionIdempotency } from "../../../apps/admin/lib/action-idempotency";

describe("beginActionIdempotency (purchase)", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockStore.mockReset();
    mockUpdate.mockReset();
  });

  it("stores key with resourceType=purchase + action=confirm", async () => {
    mockCheck.mockResolvedValueOnce(null);
    mockStore.mockResolvedValueOnce(undefined);

    await beginActionIdempotency({
      clientToken: "tok-po-1",
      resourceType: "purchase",
      resourceId: "po-1",
      action: "confirm",
      payload: {},
    });

    expect(mockStore.mock.calls[0][0]).toMatchObject({
      key: "tok-po-1",
      resourceType: "purchase",
      requestPayload: { resourceId: "po-1", action: "confirm" },
    });
  });

  it("returns cached response on same-action replay (no duplicate confirm)", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { resourceId: "po-1", action: "confirm" },
      response: { success: true, purchaseOrder: { id: "po-1", status: "ordered" } },
    });

    const result = await beginActionIdempotency({
      clientToken: "tok-po-2",
      resourceType: "purchase",
      resourceId: "po-1",
      action: "confirm",
      payload: {},
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(200);
      await expect(result.replay.json()).resolves.toMatchObject({
        purchaseOrder: { id: "po-1", status: "ordered" },
      });
    }
  });

  it("returns 409 when same token reused on the same PO for confirm vs cancel", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { resourceId: "po-1", action: "confirm" },
      response: { success: true, purchaseOrder: { id: "po-1" } },
    });

    const result = await beginActionIdempotency({
      clientToken: "tok-po-3",
      resourceType: "purchase",
      resourceId: "po-1",
      action: "cancel",
      payload: {},
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(409);
      const body = await result.replay.json();
      expect(body.error).toMatch(/different payload/);
    }
  });
});
