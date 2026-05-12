/**
 * R11: Idempotency on POST /api/admin/payouts (create supplier payment).
 *
 * Replaying a duplicate request (network drop + retry) must NOT create a
 * second payout — losing money to the supplier and silently corrupting
 * receipt.paidAmount via recomputeReceiptPaymentStatus.
 *
 * The route delegates to the generic `beginIdempotency` wrapper. These tests
 * mock the underlying primitives and exercise the wrapper's decision tree
 * with `resourceType: "payout"`.
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

import { beginIdempotency } from "../../../apps/admin/lib/idempotency";

const PAYLOAD = {
  supplierId: "sup-1",
  receiptId: "rec-1",
  amount: "500000",
  method: "cash",
  referenceCode: null,
  paidAt: null,
  note: null,
};

describe("beginIdempotency (payout)", () => {
  beforeEach(() => {
    mockCheck.mockReset();
    mockStore.mockReset();
    mockUpdate.mockReset();
  });

  it("is a no-op when clientToken is absent (legacy clients keep working)", async () => {
    const result = await beginIdempotency({
      clientToken: undefined,
      resourceType: "payout",
      payload: PAYLOAD,
    });

    expect("replay" in result).toBe(false);
    if ("finalize" in result) {
      await result.finalize({ ok: true }, "pay-1");
    }
    expect(mockCheck).not.toHaveBeenCalled();
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("stores a new key with resourceType='payout' and finalizes with payment.id", async () => {
    mockCheck.mockResolvedValueOnce(null);
    mockStore.mockResolvedValueOnce(undefined);
    mockUpdate.mockResolvedValueOnce(undefined);

    const result = await beginIdempotency({
      clientToken: "tok-payout-1",
      resourceType: "payout",
      payload: PAYLOAD,
    });

    expect("replay" in result).toBe(false);
    expect(mockStore).toHaveBeenCalledTimes(1);
    expect(mockStore.mock.calls[0][0]).toMatchObject({
      key: "tok-payout-1",
      resourceType: "payout",
      requestPayload: PAYLOAD,
    });

    if ("finalize" in result) {
      await result.finalize({ success: true, payment: { id: "pay-1" } }, "pay-1");
    }
    expect(mockUpdate).toHaveBeenCalledWith("tok-payout-1", "pay-1", {
      success: true,
      payment: { id: "pay-1" },
    });
  });

  it("returns cached response on duplicate retry with same payload (no re-execute)", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: PAYLOAD,
      response: { success: true, payment: { id: "pay-1", amount: "500000" } },
    });

    const result = await beginIdempotency({
      clientToken: "tok-payout-2",
      resourceType: "payout",
      payload: PAYLOAD,
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(200);
      await expect(result.replay.json()).resolves.toEqual({
        success: true,
        payment: { id: "pay-1", amount: "500000" },
      });
    }
    expect(mockStore).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 409 when same token reused for a DIFFERENT payload (e.g. amount changed)", async () => {
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: { ...PAYLOAD, amount: "500000" },
      response: { success: true, payment: { id: "pay-1" } },
    });

    const result = await beginIdempotency({
      clientToken: "tok-payout-3",
      resourceType: "payout",
      payload: { ...PAYLOAD, amount: "9999999" }, // different amount, same token
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
      requestPayload: PAYLOAD,
      response: null,
    });

    const result = await beginIdempotency({
      clientToken: "tok-payout-4",
      resourceType: "payout",
      payload: PAYLOAD,
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(409);
      const body = await result.replay.json();
      expect(body.error).toMatch(/in progress/);
    }
  });

  it("handles unique-constraint race: another worker stored same key first", async () => {
    mockCheck.mockResolvedValueOnce(null); // first check: nothing
    const raceErr: any = new Error("unique violation");
    raceErr.code = "23505";
    mockStore.mockRejectedValueOnce(raceErr);
    // After the race, re-check finds the response written by the winning worker.
    mockCheck.mockResolvedValueOnce({
      exists: true,
      requestPayload: PAYLOAD,
      response: { success: true, payment: { id: "pay-race" } },
    });

    const result = await beginIdempotency({
      clientToken: "tok-payout-5",
      resourceType: "payout",
      payload: PAYLOAD,
    });

    expect("replay" in result).toBe(true);
    if ("replay" in result) {
      expect(result.replay.status).toBe(200);
      await expect(result.replay.json()).resolves.toEqual({
        success: true,
        payment: { id: "pay-race" },
      });
    }
  });
});
