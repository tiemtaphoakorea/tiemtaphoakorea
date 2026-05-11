import { describe, expect, it, vi } from "vitest";
import {
  recordPageRestore,
  recoverFrozenQueries,
  recoverRestoredPage,
  recoverStuckPageSkeleton,
  wasRecentlyRestored,
} from "../../../apps/admin/lib/admin-lifecycle";

function createQueryClient(states: Array<{ status: string; fetchStatus: string }>) {
  return {
    getQueryCache: () => ({
      getAll: () => states.map((state) => ({ state })),
    }),
    cancelQueries: vi.fn(),
    invalidateQueries: vi.fn(),
  };
}

describe("admin lifecycle recovery", () => {
  it("cancels and invalidates queries that are stuck pending after resume", () => {
    const queryClient = createQueryClient([{ status: "pending", fetchStatus: "fetching" }]);

    recoverFrozenQueries(queryClient);

    expect(queryClient.cancelQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no query is stuck pending after resume", () => {
    const queryClient = createQueryClient([{ status: "success", fetchStatus: "idle" }]);

    recoverFrozenQueries(queryClient);

    expect(queryClient.cancelQueries).not.toHaveBeenCalled();
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it("reloads only when a recent page restore leaves the page skeleton visible", () => {
    const reload = vi.fn();
    const querySelector = vi.fn().mockReturnValue({});
    recordPageRestore(10_000);

    recoverStuckPageSkeleton({
      querySelector,
      reload,
      now: 10_500,
    });

    expect(querySelector).toHaveBeenCalledWith("[data-page-skeleton]");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("does not reload skeletons outside the restore window", () => {
    const reload = vi.fn();
    const querySelector = vi.fn().mockReturnValue({});
    recordPageRestore(10_000);

    recoverStuckPageSkeleton({
      querySelector,
      reload,
      now: 21_000,
    });

    expect(querySelector).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it("keeps a short restore window so page skeletons mounted after the event can recover", () => {
    recordPageRestore(10_000);

    expect(wasRecentlyRestored(10_500)).toBe(true);
    expect(wasRecentlyRestored(21_000)).toBe(false);
  });

  it("recovers a restored page from focus-like lifecycle events", () => {
    const queryClient = createQueryClient([{ status: "pending", fetchStatus: "fetching" }]);
    const reload = vi.fn();

    recoverRestoredPage({
      queryClient,
      querySelector: vi.fn().mockReturnValue({}),
      reload,
      now: 30_000,
    });

    expect(queryClient.cancelQueries).toHaveBeenCalledTimes(1);
    expect(queryClient.invalidateQueries).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(wasRecentlyRestored(30_500)).toBe(true);
  });
});
