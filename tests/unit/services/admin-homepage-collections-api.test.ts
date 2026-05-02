/**
 * Admin Homepage Collections API Route Tests
 * Tests auth enforcement and correct responses for /api/admin/homepage-collections routes.
 */

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Top-level mocks (hoisted before imports) ────────────────────────────────

vi.mock("@/lib/auth.server", () => ({
  getInternalUser: vi.fn(),
}));

vi.mock("@/services/homepage-collection.server", () => ({
  listCollectionsForAdmin: vi.fn().mockResolvedValue([
    {
      id: "c1",
      type: "manual",
      title: "Featured",
      subtitle: null,
      iconKey: null,
      viewAllUrl: null,
      itemLimit: 5,
      isActive: true,
      sortOrder: 0,
      categoryId: null,
      daysWindow: null,
      productCount: 0,
    },
  ]),
  getCollection: vi.fn(),
  createCollection: vi.fn().mockResolvedValue({
    id: "new-id",
    type: "manual",
    title: "New",
    subtitle: null,
    iconKey: null,
    viewAllUrl: null,
    itemLimit: 5,
    isActive: true,
    sortOrder: 0,
    categoryId: null,
    daysWindow: null,
  }),
  updateCollection: vi.fn().mockResolvedValue({ id: "c1", title: "Updated" }),
  deleteCollection: vi.fn().mockResolvedValue(undefined),
  reorderCollections: vi.fn().mockResolvedValue(undefined),
  setCollectionProducts: vi.fn().mockResolvedValue(undefined),
}));

// ── Import after mocks ──────────────────────────────────────────────────────

import { getInternalUser } from "@/lib/auth.server";

// ── Helpers ─────────────────────────────────────────────────────────────────

const mockUser = { user: { id: "u1", username: "admin", role: "owner" }, profile: {} as any };

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("GET /api/admin/homepage-collections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/homepage-collections/route");
    const res = await GET(makeRequest("GET", "http://localhost/api/admin/homepage-collections"));
    expect(res.status).toBe(401);
  });

  it("returns collections for authenticated user", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { GET } = await import("@/app/api/admin/homepage-collections/route");
    const res = await GET(makeRequest("GET", "http://localhost/api/admin/homepage-collections"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.collections).toHaveLength(1);
  });
});

describe("POST /api/admin/homepage-collections", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates collection with valid payload", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/homepage-collections/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/homepage-collections", {
        type: "manual",
        title: "New",
        itemLimit: 5,
        sortOrder: 0,
        isActive: true,
      }),
    );
    expect(res.status).toBe(201);
  });

  it("returns 400 when title missing", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/homepage-collections/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/homepage-collections", {
        type: "manual",
        itemLimit: 5,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when by_category without categoryId", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/homepage-collections/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/homepage-collections", {
        type: "by_category",
        title: "Cat",
        itemLimit: 4,
        sortOrder: 0,
        isActive: true,
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET/PATCH/DELETE /api/admin/homepage-collections/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("GET returns collection", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { getCollection } = await import("@/services/homepage-collection.server");
    vi.mocked(getCollection).mockResolvedValue({
      id: "c1",
      type: "manual",
      title: "Featured",
      products: [{ productId: "p1", sortOrder: 0 }],
    } as any);
    const { GET } = await import("@/app/api/admin/homepage-collections/[id]/route");
    const res = await GET(
      makeRequest("GET", "http://localhost/api/admin/homepage-collections/c1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.collection).toBeDefined();
  });

  it("GET returns 404 when not found", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { getCollection } = await import("@/services/homepage-collection.server");
    vi.mocked(getCollection).mockResolvedValue(null as any);
    const { GET } = await import("@/app/api/admin/homepage-collections/[id]/route");
    const res = await GET(makeRequest("GET", "http://localhost/api/admin/homepage-collections/x"), {
      params: Promise.resolve({ id: "x" }),
    });
    expect(res.status).toBe(404);
  });

  it("PATCH updates collection", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { PATCH } = await import("@/app/api/admin/homepage-collections/[id]/route");
    const res = await PATCH(
      makeRequest("PATCH", "http://localhost/api/admin/homepage-collections/c1", {
        title: "Updated",
      }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("DELETE removes collection", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { DELETE } = await import("@/app/api/admin/homepage-collections/[id]/route");
    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/admin/homepage-collections/c1"),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
  });
});

describe("POST /api/admin/homepage-collections/reorder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reorders collections", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/homepage-collections/reorder/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/homepage-collections/reorder", {
        ids: ["a", "b", "c"],
      }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when ids not array", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/homepage-collections/reorder/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/homepage-collections/reorder", {
        ids: "not array",
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/admin/homepage-collections/[id]/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets products for collection", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { PUT } = await import("@/app/api/admin/homepage-collections/[id]/products/route");
    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/admin/homepage-collections/c1/products", {
        productIds: ["p1", "p2"],
      }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(200);
  });

  it("returns 400 when productIds not array", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { PUT } = await import("@/app/api/admin/homepage-collections/[id]/products/route");
    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/admin/homepage-collections/c1/products", {
        productIds: "x",
      }),
      { params: Promise.resolve({ id: "c1" }) },
    );
    expect(res.status).toBe(400);
  });
});
