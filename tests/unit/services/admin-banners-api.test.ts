/**
 * Admin Banners API Route Tests
 * Tests auth enforcement and correct responses for /api/admin/banners routes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ── Top-level mocks (hoisted before imports) ────────────────────────────────

vi.mock("@/lib/auth.server", () => ({
  getInternalUser: vi.fn(),
}));

vi.mock("@/services/banner.server", () => ({
  getAllBannersForAdmin: vi.fn().mockResolvedValue([
    {
      id: "banner-1",
      type: "custom",
      categoryId: null,
      imageUrl: "https://example.com/img.jpg",
      title: "Sale 50%",
      isActive: true,
      sortOrder: 0,
      startsAt: null,
      endsAt: null,
    },
  ]),
  createBanner: vi.fn().mockResolvedValue({
    id: "banner-new",
    type: "custom",
    imageUrl: "https://example.com/img.jpg",
    title: "New Banner",
    isActive: true,
    sortOrder: 0,
  }),
  updateBanner: vi.fn().mockResolvedValue({
    id: "banner-1",
    type: "custom",
    imageUrl: "https://example.com/img.jpg",
    title: "Updated",
    isActive: true,
    sortOrder: 0,
  }),
  deleteBanner: vi.fn().mockResolvedValue(undefined),
  reorderBanners: vi.fn().mockResolvedValue(undefined),
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

describe("GET /api/admin/banners", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { GET } = await import("@/app/api/admin/banners/route");
    const res = await GET(makeRequest("GET", "http://localhost/api/admin/banners"));
    expect(res.status).toBe(401);
  });

  it("returns banners list when authenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { GET } = await import("@/app/api/admin/banners/route");
    const res = await GET(makeRequest("GET", "http://localhost/api/admin/banners"));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.banners).toHaveLength(1);
    expect(body.banners[0].id).toBe("banner-1");
  });
});

describe("POST /api/admin/banners", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/banners/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/banners", {
        type: "custom",
        imageUrl: "https://example.com/img.jpg",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a banner and returns 201", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/banners/route");
    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/banners", {
        type: "custom",
        imageUrl: "https://example.com/img.jpg",
        title: "New Banner",
      }),
    );
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.banner).toBeDefined();
  });
});

describe("PATCH /api/admin/banners/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/admin/banners/[id]/route");
    const req = makeRequest(
      "PATCH",
      "http://localhost/api/admin/banners/banner-1",
      { title: "Updated" },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "banner-1" }) });
    expect(res.status).toBe(401);
  });

  it("updates a banner and returns success", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { PATCH } = await import("@/app/api/admin/banners/[id]/route");
    const req = makeRequest(
      "PATCH",
      "http://localhost/api/admin/banners/banner-1",
      { title: "Updated" },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: "banner-1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("DELETE /api/admin/banners/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { DELETE } = await import("@/app/api/admin/banners/[id]/route");
    const req = makeRequest("DELETE", "http://localhost/api/admin/banners/banner-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "banner-1" }) });
    expect(res.status).toBe(401);
  });

  it("deletes a banner and returns success", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { DELETE } = await import("@/app/api/admin/banners/[id]/route");
    const req = makeRequest("DELETE", "http://localhost/api/admin/banners/banner-1");
    const res = await DELETE(req, { params: Promise.resolve({ id: "banner-1" }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});

describe("POST /api/admin/banners/reorder", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(null);
    const { POST } = await import("@/app/api/admin/banners/reorder/route");
    const req = makeRequest("POST", "http://localhost/api/admin/banners/reorder", {
      ids: ["b2", "b1"],
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when ids is not an array", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/banners/reorder/route");
    const req = makeRequest("POST", "http://localhost/api/admin/banners/reorder", {
      ids: "not-an-array",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("reorders banners and returns success", async () => {
    vi.mocked(getInternalUser).mockResolvedValue(mockUser);
    const { POST } = await import("@/app/api/admin/banners/reorder/route");
    const req = makeRequest("POST", "http://localhost/api/admin/banners/reorder", {
      ids: ["banner-2", "banner-1"],
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });
});
