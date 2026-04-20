/**
 * Unit tests for the shared idempotency wrapper used by the three admin
 * order action routes (stock-out, complete, cancel).
 *
 * The helper itself is thin — it composes four functions from
 * @workspace/database/lib/idempotency. These tests mock those four primitives
 * and exercise the decision tree the helper encodes:
 *
 *   1. No clientToken → finalize is a no-op, no DB access.
 *   2. New clientToken → stores key, returns a finalize that writes the response.
 *   3. Replay with same payload + cached response → returns 200 with cached body.
 *   4. Replay with mismatched payload → returns 409 "different payload".
 *   5. Replay where key exists but response is missing → returns 409 "in progress".
 *
 * The action discriminator in the stored payload is what makes this helper
 * safe to share across three routes, so case 4 specifically crosses actions
 * with the same token to prove that collision surfaces as a conflict rather
 * than returning the wrong cached response.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.mock() is hoisted above imports, but module-level `const`s are not, so
// plain top-level mocks fall into the TDZ and never intercept. vi.hoisted()
// gives us a block we can safely reference inside the mock factory.
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

// Import AFTER the mock so the helper picks up the mocked module.
import { beginOrderIdempotency } from "../../../apps/admin/lib/order-idempotency";

describe("beginOrderIdempotency", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockStore.mockReset();
    mockUpdate.mockReset();
  });

  it("is a no-op when clientToken is absent", async () => {
    const result = await beginOrderIdempotency({
      clientToken: undefined,
      orderId: "order-1",
      action: "stock_out",
      payload: { note: "n" },
    });

    expect("replay" in result).toBe(false);
    if ("finalize" in result) {
      // finalize must be callable and must not write through to the DB.
      await result.finalize({ ok: true });
    }
    expect(mockCheck).not.toHaveBeenCalled();
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("stores a new key and later writes the response via finalize", async () => {
    mockCheck.mockResolvedValueOnce(null); // first call: nothing stored
    mockStore.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await beginOrderIdempotency({
      clientToken: "tok-1",
      orderId: "order-1",
      action: "stock_out",
      payload: { note: "hello" },
    });

    expect("replay" in result).toBe(false);
    expect(mockStore).toHaveBeenCalledTimes(1);
    // The stored payload must include the action discriminator so a mismatched
    // action on replay surfaces as a conflict instead of a wrong cache hit.
    expect(mockStore.mock.calls[0][0]).toMatchObject({
      key: "tok-1",
      resourceType: "order",
      requestPayload: { orderId: "order-1", action: "stock_out", note: "hello" },
    });

    if ("finalize" in result) {
      await result.finalize({ success: true, order: { id: "order-1" } });
    }
    expect(mockUpdate).toHaveBeenCalledWith("tok-1", "order-1", {
      success: true,
      order: { id: "order-1" },
    });
  });

  it("returns the cached response on same-payload replay without re-running work", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { orderId: "order-1", action: "complete", note: "n" },
      response: { success: true, order: { id: "order-1", fulfillmentStatus: "completed" } },
    });

    const result = await beginOrderIdempotency({
      clientToken: "tok-2",
      orderId: "order-1",
      action: "complete",
      payload: { note: "n" },
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(200);
      await expect(result.replay.json()).resolves.toEqual({
        success: true,
        order: { id: "order-1", fulfillmentStatus: "completed" },
      });
    }
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 409 conflict when the same token is reused for a different action", async () => {
    // Same clientToken previously used for stock_out, now presented as cancel.
    // Without the action discriminator in the payload the helper would wrongly
    // replay the stock_out response for the cancel route.
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { orderId: "order-1", action: "stock_out", note: "n" },
      response: { success: true, order: { id: "order-1" } },
    });

    const result = await beginOrderIdempotency({
      clientToken: "tok-3",
      orderId: "order-1",
      action: "cancel",
      payload: { note: "n" },
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(409);
      const body = await result.replay.json();
      expect(body.error).toMatch(/different payload/);
    }
  });

  it("returns 409 'in progress' when key exists but response is not yet written", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { orderId: "order-1", action: "stock_out", note: "n" },
      response: null, // key stored, work not finished
    });

    const result = await beginOrderIdempotency({
      clientToken: "tok-4",
      orderId: "order-1",
      action: "stock_out",
      payload: { note: "n" },
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(409);
      const body = await result.replay.json();
      expect(body.error).toMatch(/in progress/);
    }
  });
});
