import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db/db.server";
import {
  type CategoryWithChildren,
  createCategory,
  deleteCategory,
  generateCategorySlug,
  getCategories,
  getCategoryById,
  getFlatCategories,
  updateCategory,
} from "@/services/category.server";

// Mock the db.server module
vi.mock("@/db/db.server", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() =>
          Promise.resolve([
            {
              id: "1",
              name: "Electronics",
              displayOrder: 1,
              parentId: null,
              slug: "electronics",
            },
            {
              id: "2",
              name: "Phones",
              displayOrder: 2,
              parentId: "1",
              slug: "phones",
            },
            {
              id: "3",
              name: "Laptops",
              displayOrder: 3,
              parentId: "1",
              slug: "laptops",
            },
          ]),
        ),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [
          {
            id: "new-cat-id",
            name: "Test Category",
            slug: "test-category",
            description: "Test description",
            parentId: null,
            isActive: true,
            displayOrder: 0,
          },
        ]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [
            {
              id: "cat-id",
              name: "Updated Category",
              slug: "test-category",
              description: "Updated desc",
              parentId: null,
            },
          ]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe("Category Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.select as any).mockImplementation(() => ({
      from: vi.fn(() => ({
        orderBy: vi.fn(() =>
          Promise.resolve([
            {
              id: "1",
              name: "Electronics",
              displayOrder: 1,
              parentId: null,
              slug: "electronics",
            },
            {
              id: "2",
              name: "Phones",
              displayOrder: 2,
              parentId: "1",
              slug: "phones",
            },
            {
              id: "3",
              name: "Laptops",
              displayOrder: 3,
              parentId: "1",
              slug: "laptops",
            },
          ]),
        ),
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
      })),
    }));
  });

  describe("getCategories", () => {
    it("should return hierarchical tree when no search is provided", async () => {
      const categories = (await getCategories()) as CategoryWithChildren[];
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Electronics");
      expect(categories[0].children).toHaveLength(2);
    });

    it("should return flat list when search is provided", async () => {
      // Mocking return value for specific test case manually would be cleaner if refactored
      // But here we rely on the default mock behaving well enough or just test logic
      const categories = await getCategories("Phones");
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Phones");
    });

    it("should treat missing parent as root", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          orderBy: vi.fn(() =>
            Promise.resolve([
              {
                id: "orphan-1",
                name: "Orphan",
                displayOrder: 1,
                parentId: "missing-parent",
                slug: "orphan",
              },
            ]),
          ),
        })),
      });

      const categories = (await getCategories()) as CategoryWithChildren[];
      expect(categories).toHaveLength(1);
      expect(categories[0].name).toBe("Orphan");
    });

    it("should return empty array when no categories", async () => {
      (db.select as any).mockReturnValueOnce({
        from: vi.fn(() => ({
          orderBy: vi.fn(() => Promise.resolve([])),
        })),
      });

      const categories = await getCategories();
      expect(categories).toHaveLength(0);
    });
  });

  describe("createCategory", () => {
    it("should create a category", async () => {
      const data = {
        name: "Test Category",
        slug: "test-category",
        description: "Test description",
        parentId: null,
        isActive: true,
        displayOrder: 0,
      };
      const result = await createCategory(data);
      expect(db.insert).toHaveBeenCalled();
      expect(result.id).toBe("new-cat-id");
    });
  });

  describe("updateCategory", () => {
    it("should update a category", async () => {
      const result = await updateCategory("cat-id", {
        name: "Updated Category",
      });
      expect(db.update).toHaveBeenCalled();
      expect(result.name).toBe("Updated Category");
    });

    it("should throw error if parent is self", async () => {
      await expect(updateCategory("cat-id", { parentId: "cat-id" })).rejects.toThrow(
        "A category cannot be its own parent",
      );
    });
  });

  describe("deleteCategory", () => {
    it("should delete a category", async () => {
      await deleteCategory("cat-id");
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe("getCategoryById", () => {
    it("should return category by id", async () => {
      const mockCat = { id: "cat-1", name: "Electronics", slug: "electronics" };
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([mockCat])),
          })),
        })),
      });

      const result = await getCategoryById("cat-1");
      expect(result).toEqual(mockCat);
    });

    it("should return undefined if category not found", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      });

      const result = await getCategoryById("non-existent");
      expect(result).toBeUndefined();
    });
  });

  // Note: getFlatCategories depends on getCategories internally and is tested
  // implicitly through hierarchical tests above
  describe("getFlatCategories", () => {
    it("should flatten tree with depth", async () => {
      const flat = await getFlatCategories();
      expect(flat).toHaveLength(3);
      expect(flat[0].depth).toBe(0);
      expect(flat[1].depth).toBe(1);
    });
  });

  describe("generateCategorySlug", () => {
    it("should generate unique slug from name", async () => {
      // Mock no existing categories
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      });

      const result = await generateCategorySlug("Electronics & Gadgets");
      expect(result).toBe("electronics-gadgets");
    });

    it("should handle accented characters", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([])),
        })),
      });

      // Test with accented characters that normalize properly
      const result = await generateCategorySlug("Điện thoại");
      // Unicode normalization removes accents but "đ" doesn't have a base letter
      expect(result).toBe("ien-thoai");
    });

    it("should increment counter for existing slug", async () => {
      // First call: slug exists, second call: slug-1 doesn't exist
      let callCount = 0;
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve([{ id: "existing-id" }]);
            }
            return Promise.resolve([]);
          }),
        })),
      });

      const result = await generateCategorySlug("Electronics");
      expect(result).toBe("electronics-1");
    });

    it("should allow same slug when excludeId matches", async () => {
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve([{ id: "cat-existing" }])),
        })),
      });

      const result = await generateCategorySlug("Electronics", "cat-existing");
      expect(result).toBe("electronics");
    });

    it("should handle duplicate name with multiple collisions", async () => {
      let callCount = 0;
      (db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => {
            callCount++;
            if (callCount <= 2) {
              return Promise.resolve([{ id: "existing-id" }]);
            }
            return Promise.resolve([]);
          }),
        })),
      });

      const result = await generateCategorySlug("Electronics");
      expect(result).toBe("electronics-2");
    });
  });
});
