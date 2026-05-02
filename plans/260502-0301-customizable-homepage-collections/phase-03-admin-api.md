# Phase 03 — Admin API Routes + Client Methods

**Goal:** Expose service layer through admin API routes (REST), add admin.client methods for the UI to call.

**Depends on:** Phase 1 complete.

**Files:**
- Create: `apps/admin/app/api/admin/homepage-collections/route.ts`
- Create: `apps/admin/app/api/admin/homepage-collections/[id]/route.ts`
- Create: `apps/admin/app/api/admin/homepage-collections/[id]/products/route.ts`
- Create: `apps/admin/app/api/admin/homepage-collections/reorder/route.ts`
- Create: `tests/unit/services/admin-homepage-collections-api.test.ts`
- Modify: `apps/admin/services/admin.client.ts` (add methods)
- Modify: `apps/admin/lib/query-keys.ts` (add keys)

---

## Task 3.1: GET (list) + POST (create)

- [ ] **Step 1: Write failing API test**

Create `tests/unit/services/admin-homepage-collections-api.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

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
  updateCollection: vi.fn(),
  deleteCollection: vi.fn().mockResolvedValue(undefined),
  reorderCollections: vi.fn().mockResolvedValue(undefined),
  setCollectionProducts: vi.fn().mockResolvedValue(undefined),
}));

import { getInternalUser } from "@/lib/auth.server";

describe("/api/admin/homepage-collections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 without user", async () => {
    (getInternalUser as any).mockResolvedValue(null);
    const { GET } = await import(
      "@admin/app/api/admin/homepage-collections/route"
    );
    const res = await GET(new NextRequest("http://x/api/admin/homepage-collections"));
    expect(res.status).toBe(401);
  });

  it("GET returns collections for authenticated user", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { GET } = await import(
      "@admin/app/api/admin/homepage-collections/route"
    );
    const res = await GET(new NextRequest("http://x/api/admin/homepage-collections"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.collections).toHaveLength(1);
  });

  it("POST creates collection with valid payload", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { POST } = await import(
      "@admin/app/api/admin/homepage-collections/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections", {
      method: "POST",
      body: JSON.stringify({
        type: "manual",
        title: "New",
        itemLimit: 5,
        sortOrder: 0,
        isActive: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it("POST returns 400 when title missing", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { POST } = await import(
      "@admin/app/api/admin/homepage-collections/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections", {
      method: "POST",
      body: JSON.stringify({ type: "manual", itemLimit: 5 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("POST returns 400 when by_category without categoryId", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { POST } = await import(
      "@admin/app/api/admin/homepage-collections/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections", {
      method: "POST",
      body: JSON.stringify({
        type: "by_category",
        title: "Cat",
        itemLimit: 4,
        sortOrder: 0,
        isActive: true,
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

Note: alias `@admin` matches `apps/admin` per `vitest.config.ts` (verify and adjust to `adminApp` alias used in vitest config — it's `@admin` per the config we read; if not, use the actual alias defined).

- [ ] **Step 2: Verify alias in vitest.config.ts**

```bash
grep -A 20 "alias:" /Users/kien.ha/Code/auth_shop_platform/vitest.config.ts | head -30
```

If `@admin` alias absent, add it. Edit `vitest.config.ts` — within `alias:` block:

```ts
"@admin": adminApp("."),
```

(Use the existing `adminApp` helper.)

- [ ] **Step 3: Run test — verify it fails**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create the route file**

Create `apps/admin/app/api/admin/homepage-collections/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createCollection,
  listCollectionsForAdmin,
  type CreateCollectionData,
  type HomepageCollectionType,
} from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

const VALID_TYPES: HomepageCollectionType[] = [
  "manual",
  "best_sellers",
  "new_arrivals",
  "by_category",
];

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const collections = await listCollectionsForAdmin();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Failed to list homepage collections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const data = (await request.json()) as Partial<CreateCollectionData>;

    // Required fields
    if (!data.type || !VALID_TYPES.includes(data.type as HomepageCollectionType)) {
      return NextResponse.json({ error: "Invalid type" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      return NextResponse.json({ error: "Title required" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    // Type-specific validation
    if (data.type === "by_category" && !data.categoryId) {
      return NextResponse.json(
        { error: "categoryId required for by_category" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const collection = await createCollection({
      type: data.type as HomepageCollectionType,
      title: data.title.trim(),
      subtitle: data.subtitle ?? null,
      iconKey: data.iconKey ?? null,
      viewAllUrl: data.viewAllUrl ?? null,
      itemLimit: Number(data.itemLimit) || 8,
      isActive: data.isActive ?? true,
      sortOrder: Number(data.sortOrder) || 0,
      categoryId: data.type === "by_category" ? data.categoryId ?? null : null,
      daysWindow: data.type === "new_arrivals" ? Number(data.daysWindow) || 30 : null,
    });

    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error) {
    console.error("Failed to create homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 5: Run tests — verify all 5 pass**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/api/admin/homepage-collections/route.ts \
        tests/unit/services/admin-homepage-collections-api.test.ts \
        vitest.config.ts
git commit -m "feat(admin): add GET/POST /api/admin/homepage-collections"
```

---

## Task 3.2: GET / PATCH / DELETE by id

- [ ] **Step 1: Add tests for [id] route**

Append to `tests/unit/services/admin-homepage-collections-api.test.ts` (new describe):

```ts
describe("/api/admin/homepage-collections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns collection with products", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { getCollection } = await import("@/services/homepage-collection.server");
    (getCollection as any).mockResolvedValue({
      id: "c1",
      type: "manual",
      title: "Featured",
      products: [{ productId: "p1", sortOrder: 0 }],
    });
    const { GET } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/route"
    );
    const res = await GET(new NextRequest("http://x/api/admin/homepage-collections/c1"), {
      params: Promise.resolve({ id: "c1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.collection.products).toHaveLength(1);
  });

  it("GET returns 404 when not found", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { getCollection } = await import("@/services/homepage-collection.server");
    (getCollection as any).mockResolvedValue(null);
    const { GET } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/route"
    );
    const res = await GET(new NextRequest("http://x/api/admin/homepage-collections/x"), {
      params: Promise.resolve({ id: "x" }),
    });
    expect(res.status).toBe(404);
  });

  it("PATCH updates collection", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { updateCollection } = await import("@/services/homepage-collection.server");
    (updateCollection as any).mockResolvedValue({ id: "c1", title: "Updated" });
    const { PATCH } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections/c1", {
      method: "PATCH",
      body: JSON.stringify({ title: "Updated" }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(200);
  });

  it("DELETE removes collection", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { DELETE } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/route"
    );
    const res = await DELETE(new NextRequest("http://x/api/admin/homepage-collections/c1"), {
      params: Promise.resolve({ id: "c1" }),
    });
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

Expected: 4 FAIL (route file missing).

- [ ] **Step 3: Create the [id] route file**

Create `apps/admin/app/api/admin/homepage-collections/[id]/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import {
  deleteCollection,
  getCollection,
  updateCollection,
  type UpdateCollectionData,
} from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const { id } = await ctx.params;
  const collection = await getCollection(id);
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: HTTP_STATUS.NOT_FOUND });
  }
  return NextResponse.json({ collection });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  try {
    const { id } = await ctx.params;
    const data = (await request.json()) as UpdateCollectionData;
    const collection = await updateCollection(id, data);
    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error("Failed to update homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  try {
    const { id } = await ctx.params;
    await deleteCollection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/admin/app/api/admin/homepage-collections/\[id\]/route.ts \
        tests/unit/services/admin-homepage-collections-api.test.ts
git commit -m "feat(admin): add GET/PATCH/DELETE /api/admin/homepage-collections/[id]"
```

---

## Task 3.3: Reorder + set products endpoints

- [ ] **Step 1: Add tests**

Append to test file:

```ts
describe("/api/admin/homepage-collections/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST reorders collections", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { POST } = await import(
      "@admin/app/api/admin/homepage-collections/reorder/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections/reorder", {
      method: "POST",
      body: JSON.stringify({ ids: ["a", "b", "c"] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("POST returns 400 when ids not array", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { POST } = await import(
      "@admin/app/api/admin/homepage-collections/reorder/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections/reorder", {
      method: "POST",
      body: JSON.stringify({ ids: "not array" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("/api/admin/homepage-collections/[id]/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PUT sets products for manual collection", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { PUT } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/products/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections/c1/products", {
      method: "PUT",
      body: JSON.stringify({ productIds: ["p1", "p2"] }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(200);
  });

  it("PUT returns 400 when productIds not array", async () => {
    (getInternalUser as any).mockResolvedValue({ id: "u1" });
    const { PUT } = await import(
      "@admin/app/api/admin/homepage-collections/[id]/products/route"
    );
    const req = new NextRequest("http://x/api/admin/homepage-collections/c1/products", {
      method: "PUT",
      body: JSON.stringify({ productIds: "x" }),
    });
    const res = await PUT(req, { params: Promise.resolve({ id: "c1" }) });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

- [ ] **Step 3: Create reorder route**

Create `apps/admin/app/api/admin/homepage-collections/reorder/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import { reorderCollections } from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    await reorderCollections(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder homepage collections:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 4: Create [id]/products route**

Create `apps/admin/app/api/admin/homepage-collections/[id]/products/route.ts`:

```ts
import { getInternalUser } from "@workspace/database/lib/auth";
import { setCollectionProducts } from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  try {
    const { id } = await ctx.params;
    const { productIds } = await request.json();
    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "productIds must be an array" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    await setCollectionProducts(id, productIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set collection products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
```

- [ ] **Step 5: Run tests — verify all pass**

```bash
pnpm test -- tests/unit/services/admin-homepage-collections-api.test.ts
```

Expected: PASS (13 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/admin/app/api/admin/homepage-collections/reorder/route.ts \
        apps/admin/app/api/admin/homepage-collections/\[id\]/products/route.ts \
        tests/unit/services/admin-homepage-collections-api.test.ts
git commit -m "feat(admin): add reorder + set-products endpoints"
```

---

## Task 3.4: Admin client + query keys

- [ ] **Step 1: Read existing admin.client.ts to understand pattern**

```bash
grep -n "getBanners\|getCategories\|getProducts" /Users/kien.ha/Code/auth_shop_platform/apps/admin/services/admin.client.ts | head -10
```

- [ ] **Step 2: Add methods to admin.client.ts**

Locate the class/object exporting `adminClient`. Append methods:

```ts
async listHomepageCollections() {
  const { data } = await this.http.get("/api/admin/homepage-collections");
  return data.collections as Array<{
    id: string;
    type: "manual" | "best_sellers" | "new_arrivals" | "by_category";
    title: string;
    subtitle: string | null;
    iconKey: string | null;
    viewAllUrl: string | null;
    itemLimit: number;
    isActive: boolean;
    sortOrder: number;
    categoryId: string | null;
    daysWindow: number | null;
    productCount: number;
  }>;
}

async getHomepageCollection(id: string) {
  const { data } = await this.http.get(`/api/admin/homepage-collections/${id}`);
  return data.collection;
}

async createHomepageCollection(payload: Record<string, unknown>) {
  const { data } = await this.http.post("/api/admin/homepage-collections", payload);
  return data.collection;
}

async updateHomepageCollection(id: string, payload: Record<string, unknown>) {
  const { data } = await this.http.patch(`/api/admin/homepage-collections/${id}`, payload);
  return data.collection;
}

async deleteHomepageCollection(id: string) {
  await this.http.delete(`/api/admin/homepage-collections/${id}`);
}

async reorderHomepageCollections(ids: string[]) {
  await this.http.post("/api/admin/homepage-collections/reorder", { ids });
}

async setHomepageCollectionProducts(id: string, productIds: string[]) {
  await this.http.put(`/api/admin/homepage-collections/${id}/products`, { productIds });
}
```

(Adapt naming/style to existing `adminClient` pattern — if it uses `axios.get` directly without `this.http`, use the same idiom.)

- [ ] **Step 3: Add query keys**

Edit `apps/admin/lib/query-keys.ts` — add:

```ts
homepageCollections: {
  all: ["homepage-collections"] as const,
  list: ["homepage-collections", "list"] as const,
  detail: (id: string) => ["homepage-collections", "detail", id] as const,
},
```

- [ ] **Step 4: Type-check**

```bash
pnpm --filter @workspace/admin typecheck 2>&1 | tail -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/services/admin.client.ts apps/admin/lib/query-keys.ts
git commit -m "feat(admin): add homepage collection client methods + query keys"
```

---

## Phase 3 Done When

- [ ] All 4 route files created + 13 API tests pass
- [ ] `adminClient` exposes 7 methods
- [ ] Query keys added
- [ ] No type errors
- [ ] All commits pushed
