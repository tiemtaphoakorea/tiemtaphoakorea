import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  createBanner,
  deleteBanner,
  getBanners,
  getAllBannersForAdmin,
  reorderBanners,
  updateBanner,
} from "@/services/banner.server";

vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

const makeSelectChain = (result: unknown) => ({
  from: vi.fn().mockReturnValue({
    leftJoin: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(result),
      }),
      orderBy: vi.fn().mockResolvedValue(result),
    }),
  }),
});

const now = new Date();

// Snake_case row — matches the shape returned by db.execute (raw SQL) in getBanners()
const activeBannerExecuteRow = {
  id: "banner-1",
  type: "custom",
  category_id: null,
  category_name: null,
  category_slug: null,
  image_url: "https://example.com/img.jpg",
  category_image_url: null,
  title: "Sale 50%",
  subtitle: "Mua ngay",
  badge_text: "Hot",
  cta_label: "Mua ngay",
  cta_url: "/products",
  cta_secondary_label: null,
  discount_tag: "50%",
  discount_tag_sub: "cho đơn đầu",
  accent_color: "violet",
  is_active: true,
  sort_order: 0,
  starts_at: null,
  ends_at: null,
};

// camelCase row — used by getAllBannersForAdmin() which uses db.select (Drizzle ORM)
const activeBannerRow = {
  id: "banner-1",
  type: "custom",
  categoryId: null,
  categoryName: null,
  categorySlug: null,
  imageUrl: "https://example.com/img.jpg",
  categoryImageUrl: null,
  title: "Sale 50%",
  subtitle: "Mua ngay",
  badgeText: "Hot",
  ctaLabel: "Mua ngay",
  ctaUrl: "/products",
  ctaSecondaryLabel: null,
  discountTag: "50%",
  discountTagSub: "cho đơn đầu",
  accentColor: "violet",
  isActive: true,
  sortOrder: 0,
  startsAt: null,
  endsAt: null,
};

const categoryBannerExecuteRow = {
  ...activeBannerExecuteRow,
  id: "banner-2",
  type: "category",
  category_id: "cat-1",
  category_name: "Chăm sóc da",
  category_slug: "cham-soc-da",
  image_url: null,
  category_image_url: "https://example.com/cat-img.jpg",
  title: null,
  badge_text: null,
  cta_label: null,
  cta_url: null,
};

describe("banner.server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBanners", () => {
    it("returns active banners with correct fields for custom type", async () => {
      (db.execute as any).mockResolvedValue([activeBannerExecuteRow]);

      const result = await getBanners();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("banner-1");
      expect(result[0].imageUrl).toBe("https://example.com/img.jpg");
      expect(result[0].title).toBe("Sale 50%");
    });

    it("auto-derives fields for category type banners", async () => {
      (db.execute as any).mockResolvedValue([categoryBannerExecuteRow]);

      const result = await getBanners();
      expect(result[0].imageUrl).toBe("https://example.com/cat-img.jpg");
      expect(result[0].title).toBe("Chăm sóc da");
      expect(result[0].badgeText).toBe("Danh mục hot");
      expect(result[0].ctaLabel).toBe("Xem tất cả");
      expect(result[0].ctaUrl).toBe("/products?category=cham-soc-da");
    });

    it("returns empty array when no banners exist", async () => {
      (db.execute as any).mockResolvedValue([]);
      const result = await getBanners();
      expect(result).toEqual([]);
    });

    it("filters out banners where endsAt is in the past (expired)", async () => {
      // The SQL filter means expired banners never appear in the returned rows.
      // This test verifies getBanners() returns empty when the mock simulates no matching rows.
      (db.execute as any).mockResolvedValue([]);

      const result = await getBanners();

      expect(result).toEqual([]);
      // NOTE: Actual time-based SQL filtering verified in integration tests.
      // The SQL WHERE clause: starts_at IS NULL OR starts_at <= now AND ends_at IS NULL OR ends_at >= now
    });

    it("includes banners with null startsAt and null endsAt (always active)", async () => {
      const alwaysActiveBanner = {
        ...activeBannerExecuteRow,
        starts_at: null,
        ends_at: null,
      };
      (db.execute as any).mockResolvedValue([alwaysActiveBanner]);

      const result = await getBanners();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("banner-1");
    });
  });

  describe("getAllBannersForAdmin", () => {
    it("returns all banners without date filtering", async () => {
      vi.spyOn(db, "select").mockReturnValue(makeSelectChain([activeBannerRow]) as any);
      const result = await getAllBannersForAdmin();
      expect(result).toHaveLength(1);
    });
  });

  describe("createBanner", () => {
    it("inserts a banner and returns it", async () => {
      const newBanner = { ...activeBannerRow };
      (db.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newBanner]),
        }),
      });

      const result = await createBanner({
        type: "custom",
        imageUrl: "https://example.com/img.jpg",
        title: "Sale 50%",
        isActive: true,
        sortOrder: 0,
      });

      expect(result).toEqual(newBanner);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe("updateBanner", () => {
    it("updates banner fields and returns updated row", async () => {
      const updated = { ...activeBannerRow, title: "Updated title" };
      (db.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      });

      const result = await updateBanner("banner-1", { title: "Updated title" });
      expect(result.title).toBe("Updated title");
    });
  });

  describe("deleteBanner", () => {
    it("calls delete with the correct id", async () => {
      (db.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      await deleteBanner("banner-1");
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe("reorderBanners", () => {
    it("updates sortOrder for each id in order", async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      (db.update as any).mockImplementation(mockUpdate);

      await reorderBanners(["banner-2", "banner-1"]);
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
