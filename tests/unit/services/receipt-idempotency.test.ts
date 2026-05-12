/**
 * R11: Idempotency on POST /api/admin/receipts/[id]/complete and /cancel.
 *
 * Replaying complete = duplicate stock-in + duplicate WAC update + duplicate
 * cost_price_history row. Replaying cancel = double stock reversal + double
 * PO recv qty reversal. Both must be guarded by the idempotency wrapper.
 *
 * The action discriminator inside the stored payload makes the same client
 * token unsafe to reuse across "complete" and "cancel" on the same receipt
 * — that surfaces as a 409 conflict rather than the wrong cached response.
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

describe("beginActionIdempotency (receipt)", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockStore.mockReset();
    mockUpdate.mockReset();
  });

  it("no-op when clientToken absent (preserves legacy clients)", async () => {
    const result = await beginActionIdempotency({
      clientToken: undefined,
      resourceType: "receipt",
      resourceId: "rec-1",
      action: "complete",
      payload: {},
    });

    expect("replay" in result).toBe(false);
    if ("finalize" in result) await result.finalize({ ok: true });
    expect(mockCheck).not.toHaveBeenCalled();
  });

  it("stores key with resourceType=receipt + action discriminator", async () => {
    mockCheck.mockResolvedValueOnce(null);
    mockStore.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await beginActionIdempotency({
      clientToken: "tok-rec-1",
      resourceType: "receipt",
      resourceId: "rec-1",
      action: "complete",
      payload: {},
    });

    expect(mockStore.mock.calls[0][0]).toMatchObject({
      key: "tok-rec-1",
      resourceType: "receipt",
      requestPayload: { resourceId: "rec-1", action: "complete" },
    });

    if ("finalize" in result) {
      await result.finalize({ success: true, receipt: { id: "rec-1" } });
    }
    expect(mockUpdate).toHaveBeenCalledWith("tok-rec-1", "rec-1", {
      success: true,
      receipt: { id: "rec-1" },
    });
  });

  it("returns cached response on same-payload replay (no duplicate stock-in / WAC)", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { resourceId: "rec-1", action: "complete" },
      response: { success: true, receipt: { id: "rec-1", status: "completed" } },
    });

    const result = await beginActionIdempotency({
      clientToken: "tok-rec-2",
      resourceType: "receipt",
      resourceId: "rec-1",
      action: "complete",
      payload: {},
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(200);
      await expect(result.replay.json()).resolves.toEqual({
        success: true,
        receipt: { id: "rec-1", status: "completed" },
      });
    }
    expect(mockStore).not.toHaveBeenCalled();
  });

  it("returns 409 when same token reused on the same receipt for a DIFFERENT action", async () => {
    // Previously used for complete; now presented as cancel. Without the action
    // discriminator this would silently replay the complete response on cancel.
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { resourceId: "rec-1", action: "complete" },
      response: { success: true, receipt: { id: "rec-1", status: "completed" } },
    });

    const result = await beginActionIdempotency({
      clientToken: "tok-rec-3",
      resourceType: "receipt",
      resourceId: "rec-1",
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

  it("returns 409 'in progress' when key exists but response not yet written", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { resourceId: "rec-1", action: "cancel" },
      response: null,
    });

    const result = await beginActionIdempotency({
      clientToken: "tok-rec-4",
      resourceType: "receipt",
      resourceId: "rec-1",
      action: "cancel",
      payload: {},
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) expect(result.replay.status).toBe(409);
  });
});
