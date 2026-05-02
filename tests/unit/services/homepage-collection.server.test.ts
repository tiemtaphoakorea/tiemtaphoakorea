import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock("@/services/product.server", () => ({
  getBestSellers: vi.fn(),
  getNewArrivals: vi.fn(),
}));

import { db } from "@/db/db.server";
import { getActiveHomepageCollections } from "@/services/homepage-collection.server";
import { getBestSellers, getNewArrivals } from "@/services/product.server";

beforeEach(() => {
  vi.clearAllMocks();
});

const mockProductCard = (id: string) => ({
  id,
  name: `Product ${id}`,
  slug: `product-${id}`,
  description: null,
  isActive: true,
  categoryName: null,
  basePrice: "100000",
  totalStock: 5,
  totalOnHand: 5,
  totalReserved: 0,
  totalAvailable: 5,
  minPrice: 100000,
  maxPrice: 100000,
  thumbnail: "",
});

describe("getActiveHomepageCollections", () => {
  it("dispatches best_sellers branch to getBestSellers(itemLimit)", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c1",
              type: "best_sellers",
              title: "Bán chạy",
              subtitle: null,
              iconKey: "beauty",
              viewAllUrl: null,
              itemLimit: 4,
              isActive: true,
              sortOrder: 0,
              categoryId: null,
              daysWindow: null,
            },
          ]),
        }),
      }),
    });
    (getBestSellers as any).mockResolvedValue([mockProductCard("p1"), mockProductCard("p2")]);

    const result = await getActiveHomepageCollections();

    expect(getBestSellers).toHaveBeenCalledWith(4);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("c1");
    expect(result[0].products).toHaveLength(2);
  });

  it("dispatches new_arrivals branch with daysWindow fallback to 30", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c2",
              type: "new_arrivals",
              title: "Mới",
              subtitle: null,
              iconKey: null,
              viewAllUrl: null,
              itemLimit: 8,
              isActive: true,
              sortOrder: 1,
              categoryId: null,
              daysWindow: null, // fallback to 30
            },
          ]),
        }),
      }),
    });
    (getNewArrivals as any).mockResolvedValue([mockProductCard("p3")]);

    await getActiveHomepageCollections();

    expect(getNewArrivals).toHaveBeenCalledWith(8, 30);
  });

  it("respects custom daysWindow", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c3",
              type: "new_arrivals",
              title: "Mới 7 ngày",
              subtitle: null,
              iconKey: null,
              viewAllUrl: null,
              itemLimit: 6,
              isActive: true,
              sortOrder: 2,
              categoryId: null,
              daysWindow: 7,
            },
          ]),
        }),
      }),
    });
    (getNewArrivals as any).mockResolvedValue([mockProductCard("p4")]);

    await getActiveHomepageCollections();

    expect(getNewArrivals).toHaveBeenCalledWith(6, 7);
  });

  it("filters out collections that resolve to 0 products", async () => {
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c4",
              type: "best_sellers",
              title: "Empty",
              subtitle: null,
              iconKey: null,
              viewAllUrl: null,
              itemLimit: 4,
              isActive: true,
              sortOrder: 0,
              categoryId: null,
              daysWindow: null,
            },
          ]),
        }),
      }),
    });
    (getBestSellers as any).mockResolvedValue([]);

    const result = await getActiveHomepageCollections();

    expect(result).toHaveLength(0);
  });

  it("dispatches by_category branch to getProductsByCategory", async () => {
    // Mock the outer select for collections list
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c5",
              type: "by_category",
              title: "Eyewear",
              subtitle: null,
              iconKey: null,
              viewAllUrl: null,
              itemLimit: 6,
              isActive: true,
              sortOrder: 0,
              categoryId: "cat-1",
              daysWindow: null,
            },
          ]),
        }),
      }),
    });
    // Mock the inner select for products by category
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([mockProductCard("p5")]),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const result = await getActiveHomepageCollections();

    expect(result).toHaveLength(1);
    expect(result[0].products).toHaveLength(1);
  });

  it("skips by_category collection when categoryId is null", async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c6",
              type: "by_category",
              title: "Broken",
              subtitle: null,
              iconKey: null,
              viewAllUrl: null,
              itemLimit: 4,
              isActive: true,
              sortOrder: 0,
              categoryId: null,
              daysWindow: null,
            },
          ]),
        }),
      }),
    });

    const result = await getActiveHomepageCollections();
    expect(result).toHaveLength(0);
  });

  it("dispatches manual branch ordered by junction sortOrder", async () => {
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: "c7",
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
            },
          ]),
        }),
      }),
    });
    // Inner select for manual products — joins junction
    (db.select as any).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockReturnValue({
                    limit: vi
                      .fn()
                      .mockResolvedValue([mockProductCard("p10"), mockProductCard("p11")]),
                  }),
                }),
              }),
            }),
          }),
        }),
      }),
    });

    const result = await getActiveHomepageCollections();
    expect(result[0].products).toHaveLength(2);
  });
});

describe("admin CRUD", () => {
  it("listCollectionsForAdmin returns rows with manual product counts", async () => {
    (db.execute as any).mockResolvedValue([
      {
        id: "c1",
        type: "manual",
        title: "Featured",
        subtitle: null,
        icon_key: null,
        view_all_url: null,
        item_limit: 5,
        is_active: true,
        sort_order: 0,
        category_id: null,
        days_window: null,
        created_at: new Date(),
        updated_at: new Date(),
        product_count: 3,
      },
    ]);
    const { listCollectionsForAdmin } = await import("@/services/homepage-collection.server");
    const result = await listCollectionsForAdmin();
    expect(result).toHaveLength(1);
    expect(result[0].productCount).toBe(3);
  });

  it("createCollection inserts and returns row", async () => {
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([
          {
            id: "new-id",
            type: "manual",
            title: "Test",
            subtitle: null,
            iconKey: null,
            viewAllUrl: null,
            itemLimit: 5,
            isActive: true,
            sortOrder: 0,
            categoryId: null,
            daysWindow: null,
          },
        ]),
      }),
    });
    const { createCollection } = await import("@/services/homepage-collection.server");
    const result = await createCollection({
      type: "manual",
      title: "Test",
      itemLimit: 5,
      sortOrder: 0,
      isActive: true,
    });
    expect(result.id).toBe("new-id");
  });

  it("reorderCollections updates sortOrder per id index", async () => {
    const updateChain = {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
    (db.update as any).mockReturnValue(updateChain);
    const { reorderCollections } = await import("@/services/homepage-collection.server");
    await reorderCollections(["a", "b", "c"]);
    expect(db.update).toHaveBeenCalledTimes(3);
    expect(updateChain.set).toHaveBeenNthCalledWith(1, expect.objectContaining({ sortOrder: 0 }));
    expect(updateChain.set).toHaveBeenNthCalledWith(2, expect.objectContaining({ sortOrder: 1 }));
    expect(updateChain.set).toHaveBeenNthCalledWith(3, expect.objectContaining({ sortOrder: 2 }));
  });

  it("setCollectionProducts deletes then inserts ordered junction rows", async () => {
    (db.delete as any).mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
    const { setCollectionProducts } = await import("@/services/homepage-collection.server");
    await setCollectionProducts("c1", ["p1", "p2", "p3"]);
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
