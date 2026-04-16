import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db/db.server";
import { categories } from "@/db/schema/categories";
import { orderItems, orders } from "@/db/schema/orders";
import { costPriceHistory, products, productVariants } from "@/db/schema/products";
import { profiles } from "@/db/schema/profiles";
import { BusinessError } from "@/lib/http-status";
import {
  createProduct,
  deleteProduct,
  generateProductSlug,
  getFeaturedProducts,
  getNewArrivals,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsForListing,
  getProductsWithVariants,
  updateProduct,
} from "@/services/product.server";

// Use a static valid UUID for test category so we can clean it up reliably
const TEST_CAT_ID = "11111111-1111-1111-1111-111111111111"; // Valid UUID v4-ish
const TEST_CAT_SLUG = "test-category-unit-test";
const TEST_CAT_ALT_ID = "22222222-2222-2222-2222-222222222222";
const TEST_CAT_ALT_SLUG = "test-category-alt";

// Note: To test new variant insertion, don't pass an ID at all (undefined)
// This ensures the code goes to the insert branch instead of upsert

describe("Product Service", () => {
  // Cleanup helper
  const cleanUp = async () => {
    // Delete products associated with our test category
    // This relies on Postgres CASCASE for variants/images if configured.
    // If not configured, we might need manual delete hierarchy.
    // However, schema says products->variants has cascade.

    // We fetch products first to be sure?
    // Or just delete products where categoryId = TEST_CAT_ID
    await db.delete(products).where(eq(products.categoryId, TEST_CAT_ID));
    await db.delete(products).where(eq(products.categoryId, TEST_CAT_ALT_ID));

    // Then delete category
    await db.delete(categories).where(eq(categories.id, TEST_CAT_ID));
    await db.delete(categories).where(eq(categories.id, TEST_CAT_ALT_ID));
  };

  beforeEach(async () => {
    // Ensure clean slate for this ID
    await cleanUp();

    // Create test category
    await db
      .insert(categories)
      .values({
        id: TEST_CAT_ID,
        name: "Test Category Unit Test",
        slug: TEST_CAT_SLUG,
        // Checking schema/categories.ts might be needed, but assuming standard fields
      })
      .onConflictDoNothing();

    await db
      .insert(categories)
      .values({
        id: TEST_CAT_ALT_ID,
        name: "Alt Category Unit Test",
        slug: TEST_CAT_ALT_SLUG,
      })
      .onConflictDoNothing();
  });

  afterEach(async () => {
    await cleanUp();
  });

  describe("createProduct", () => {
    it("should create a product with variants and images", async () => {
      const input = {
        name: "Test Product",
        slug: `test-product-${Date.now()}`,
        description: "Test Desc",
        categoryId: TEST_CAT_ID,
        basePrice: 100,
        variants: [
          {
            name: "Red - S",
            sku: `TEST-RED-S-${Date.now()}`,
            price: 100,
            costPrice: 50,
            stockQuantity: 10,
            images: ["http://test.com/img1.jpg"],
          },
        ],
      };

      const result = await createProduct(input);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(input.name);

      // Verify DB
      const dbProduct = await db.query.products.findFirst({
        where: eq(products.id, result.id),
        with: {
          variants: {
            with: { images: true },
          },
        },
      });

      expect(dbProduct).toBeDefined();
      expect(dbProduct?.variants.length).toBe(1);
      expect(dbProduct?.variants[0].name).toBe("Red - S");
      expect(dbProduct?.variants[0].images.length).toBe(1);
      expect(dbProduct?.variants[0].images[0].imageUrl).toBe("http://test.com/img1.jpg");
    });

    it("should throw when a variant has negative stock quantity", async () => {
      const input = {
        name: "Negative Stock Product",
        slug: `negative-stock-${Date.now()}`,
        categoryId: TEST_CAT_ID,
        basePrice: 100,
        variants: [
          {
            name: "Bad Variant",
            sku: `NEGATIVE-SKU-${Date.now()}`,
            price: 100,
            costPrice: 50,
            stockQuantity: -1, // Invalid: negative stock
          },
        ],
      };

      await expect(createProduct(input)).rejects.toThrow("Quantity cannot be negative");
    });

    it("should throw when two variants share the same SKU", async () => {
      const sku = `DUPLICATE-SKU-${Date.now()}`;
      const input = {
        name: "Duplicate SKU Product",
        slug: `duplicate-sku-${Date.now()}`,
        categoryId: TEST_CAT_ID,
        basePrice: 100,
        variants: [
          { name: "Variant A", sku, price: 100, costPrice: 50, stockQuantity: 5 },
          { name: "Variant B", sku, price: 120, costPrice: 60, stockQuantity: 3 }, // same SKU
        ],
      };

      await expect(createProduct(input)).rejects.toThrow(`SKU "${sku}" đã tồn tại`);
    });

    it("should throw when a SKU already exists in the database", async () => {
      const sku = `EXISTING-SKU-${Date.now()}`;

      // First create a product with this SKU
      await createProduct({
        name: "First Product",
        slug: `first-product-${Date.now()}`,
        categoryId: TEST_CAT_ID,
        basePrice: 100,
        variants: [{ name: "V1", sku, price: 100, costPrice: 50, stockQuantity: 5 }],
      });

      // Now try to create another product with the same SKU
      const input = {
        name: "Second Product",
        slug: `second-product-${Date.now()}`,
        categoryId: TEST_CAT_ID,
        basePrice: 100,
        variants: [
          { name: "V2", sku, price: 100, costPrice: 50, stockQuantity: 3 }, // same SKU as above
        ],
      };

      await expect(createProduct(input)).rejects.toThrow(`SKU "${sku}" đã tồn tại`);
    });
  });

  describe("getProducts", () => {
    it("should fetch products with aggregated stock data", async () => {
      const timestamp = Date.now();
      const input = {
        name: "Agg Product",
        slug: `agg-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        basePrice: 200,
        variants: [
          { name: "V1", sku: `V1-${timestamp}`, price: 200, stockQuantity: 5 },
          { name: "V2", sku: `V2-${timestamp}`, price: 200, stockQuantity: 15 },
        ],
      };
      await createProduct(input as any);

      const result = await getProducts();

      const found = result.data.find((p) => p.slug === input.slug);
      expect(found).toBeDefined();
      expect(Number(found?.totalStock)).toBe(20);
      expect(result.metadata.total).toBeGreaterThan(0);
    });
  });

  describe("generateProductSlug", () => {
    it("should generate proper slug", async () => {
      const slug = await generateProductSlug("New T-Shirt");
      expect(slug).toContain("new-t-shirt");
    });

    it("should make unique slug if conflicts", async () => {
      // 1. Create product with slug "foo"
      await db.insert(products).values({
        name: "Foo",
        slug: "foo",
        categoryId: TEST_CAT_ID,
      });

      // 2. Generate slug for "Foo"
      const newSlug = await generateProductSlug("Foo");
      expect(newSlug).not.toBe("foo");
      expect(newSlug).toMatch(/^foo-/);
    });

    it("should allow reusing slug for same product when excludeId matches", async () => {
      const [created] = await db
        .insert(products)
        .values({
          name: "Bar",
          slug: "bar",
          categoryId: TEST_CAT_ID,
        })
        .returning({ id: products.id });

      const newSlug = await generateProductSlug("Bar", created.id);
      expect(newSlug).toBe("bar");
    });
  });

  describe("deleteProduct", () => {
    it("should delete product and cascade variants", async () => {
      const timestamp = Date.now();
      const input = {
        name: "Del Product",
        slug: `del-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "V", sku: `D-${timestamp}`, price: 10 }],
      };
      const created = await createProduct(input as any);

      await deleteProduct(created.id);

      const check = await db.query.products.findFirst({
        where: eq(products.id, created.id),
      });
      expect(check).toBeUndefined();

      // Check variants gone
      const variantsCheck = await db.query.productVariants.findFirst({
        where: eq(productVariants.productId, created.id),
      });
      expect(variantsCheck).toBeUndefined();
    });

    it("should throw and leave product intact when a variant is referenced by order history", async () => {
      const timestamp = Date.now();

      // Create product with one variant
      const created = await createProduct({
        name: "Ordered Product",
        slug: `ordered-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "OV", sku: `OV-${timestamp}`, price: 50 }],
      } as any);

      const variantId = created.variants[0].id;

      // Seed a customer profile
      const [customer] = await db
        .insert(profiles)
        .values({
          username: `test-customer-${timestamp}`,
          fullName: "Test Customer",
          role: "customer",
        })
        .returning({ id: profiles.id });

      // Seed an order for that customer
      const [order] = await db
        .insert(orders)
        .values({
          orderNumber: `ORD-TEST-${timestamp}`,
          customerId: customer.id,
          subtotal: "50",
          total: "50",
        })
        .returning({ id: orders.id });

      // Seed an order item linking the order to the variant
      await db.insert(orderItems).values({
        orderId: order.id,
        variantId,
        productName: "Ordered Product",
        variantName: "OV",
        sku: `OV-${timestamp}`,
        quantity: 1,
        unitPrice: "50",
        lineTotal: "50",
      });

      try {
        await expect(deleteProduct(created.id)).rejects.toThrow(BusinessError);
        await expect(deleteProduct(created.id)).rejects.toThrow(
          "Không thể xóa sản phẩm đã có trong lịch sử đơn hàng",
        );

        // Product must still exist
        const check = await db.query.products.findFirst({
          where: eq(products.id, created.id),
        });
        expect(check).toBeDefined();
      } finally {
        // Clean up in FK-safe order
        await db.delete(orderItems).where(eq(orderItems.orderId, order.id));
        await db.delete(orders).where(eq(orders.id, order.id));
        await db.delete(profiles).where(eq(profiles.id, customer.id));
        await db.delete(products).where(eq(products.id, created.id));
      }
    });
  });
  describe("getProductById / getProductBySlug", () => {
    it("should fetch product with variants and images by id", async () => {
      const timestamp = Date.now();
      const created = await createProduct({
        name: "Detail Product",
        slug: `detail-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          {
            name: "D1",
            sku: `D1-${timestamp}`,
            price: 100,
            images: ["http://test.com/detail.jpg"],
          },
        ],
      });

      const result = await getProductById(created.id);
      expect(result?.id).toBe(created.id);
      expect(result?.variants.length).toBe(1);
      expect(result?.variants[0].images.length).toBe(1);
    });

    it("should fetch product by slug", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: "Slug Product",
        slug: `slug-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "S1", sku: `S1-${timestamp}`, price: 80 }],
      });

      const result = await getProductBySlug(`slug-product-${timestamp}`);
      expect(result?.slug).toBe(`slug-product-${timestamp}`);
    });
  });

  describe("getProducts with search", () => {
    it("should return paginated result when filtering by search term", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `Searchable Product ${timestamp}`,
        slug: `searchable-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "S1", sku: `S1-${timestamp}`, price: 50 }],
      });

      const result = await getProducts({ search: "Searchable Product" });
      expect(result).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.metadata).toBeDefined();
    });
  });

  describe("getProductsForListing", () => {
    it("should return only active products", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `Active Product ${timestamp}`,
        slug: `active-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: true,
        variants: [{ name: "A1", sku: `A1-${timestamp}`, price: 100 }],
      });
      await createProduct({
        name: `Inactive Product ${timestamp}`,
        slug: `inactive-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: false,
        variants: [{ name: "I1", sku: `I1-${timestamp}`, price: 100 }],
      });

      const result = await getProductsForListing({});
      const slugs = result.products.map((p) => p.slug);
      expect(slugs).toContain(`active-product-${timestamp}`);
      expect(slugs).not.toContain(`inactive-product-${timestamp}`);
      expect(result.total).toBeGreaterThan(0);
    });

    it("should filter by category slug", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `Cat A Product ${timestamp}`,
        slug: `cat-a-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: true,
        variants: [{ name: "A1", sku: `CA-${timestamp}`, price: 10 }],
      });
      await createProduct({
        name: `Cat B Product ${timestamp}`,
        slug: `cat-b-product-${timestamp}`,
        categoryId: TEST_CAT_ALT_ID,
        isActive: true,
        variants: [{ name: "B1", sku: `CB-${timestamp}`, price: 10 }],
      });

      const result = await getProductsForListing({
        categorySlug: TEST_CAT_SLUG,
      });
      const slugs = result.products.map((p) => p.slug);
      expect(slugs).toContain(`cat-a-product-${timestamp}`);
      expect(slugs).not.toContain(`cat-b-product-${timestamp}`);
      expect(result.total).toBeGreaterThan(0);
    });
  });

  describe("getFeaturedProducts", () => {
    it("should return limited active products only", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `Featured 1 ${timestamp}`,
        slug: `featured-1-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: true,
        variants: [{ name: "F1", sku: `F1-${timestamp}`, price: 10 }],
      });
      await createProduct({
        name: `Featured 2 ${timestamp}`,
        slug: `featured-2-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: true,
        variants: [{ name: "F2", sku: `F2-${timestamp}`, price: 10 }],
      });
      await createProduct({
        name: `Featured Inactive ${timestamp}`,
        slug: `featured-inactive-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: false,
        variants: [{ name: "FI", sku: `FI-${timestamp}`, price: 10 }],
      });

      const result = await getFeaturedProducts(2);
      expect(result.length).toBeLessThanOrEqual(2);
      expect(result.some((p) => p.slug.includes("featured-inactive"))).toBe(false);
    });
  });

  describe("getProductsWithVariants", () => {
    it("should return products with variants and images", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `With Variants ${timestamp}`,
        slug: `with-variants-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          {
            name: "WV1",
            sku: `WV1-${timestamp}`,
            price: 99,
            images: ["http://test.com/wv1.jpg"],
          },
        ],
      });

      const result = await getProductsWithVariants();
      const found = result.find((p) => p.slug === `with-variants-${timestamp}`);
      expect(found).toBeDefined();
      expect(found?.variants.length).toBeGreaterThan(0);
      expect(found?.variants[0].images.length).toBeGreaterThan(0);
    });
  });

  describe("updateProduct", () => {
    it("should update product and existing variant, and replace images", async () => {
      const timestamp = Date.now();
      const created = await createProduct({
        name: `Update Product ${timestamp}`,
        slug: `update-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        description: "Before",
        variants: [
          {
            name: "UP1",
            sku: `UP1-${timestamp}`,
            price: 100,
            images: ["http://test.com/before.jpg"],
          },
        ],
      });

      const product = await getProductById(created.id);
      const variantId = product?.variants[0].id as string;

      await updateProduct(created.id, {
        name: `Update Product ${timestamp}`,
        slug: `update-product-${timestamp}`,
        categoryId: TEST_CAT_ID,
        description: "After",
        variants: [
          {
            id: variantId,
            name: "UP1-UPDATED",
            sku: `UP1-${timestamp}`,
            price: 120,
            images: ["http://test.com/after.jpg"],
          } as any,
        ],
      });

      const updated = await getProductById(created.id);
      expect(updated?.description).toBe("After");
      expect(updated?.variants[0].name).toBe("UP1-UPDATED");
      expect(updated?.variants[0].images[0].imageUrl).toBe("http://test.com/after.jpg");
    });

    it("should insert new variant when id is temp/generated", async () => {
      const timestamp = Date.now();
      const created = await createProduct({
        name: `Insert Variant ${timestamp}`,
        slug: `insert-variant-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "IV1", sku: `IV1-${timestamp}`, price: 70 }],
      });

      await updateProduct(created.id, {
        name: `Insert Variant ${timestamp}`,
        slug: `insert-variant-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          {
            // No ID = insert new variant
            name: "IV2",
            sku: `IV2-${timestamp}`,
            price: 80,
          } as any,
        ],
      });

      const updated = await getProductById(created.id);
      const variantNames = updated?.variants.map((v) => v.name) ?? [];
      expect(variantNames).toContain("IV2");
    });

    it("should insert temp variant and save its images", async () => {
      const timestamp = Date.now();
      const created = await createProduct({
        name: `Temp Variant ${timestamp}`,
        slug: `temp-variant-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [{ name: "TV1", sku: `TV1-${timestamp}`, price: 70 }],
      });

      await updateProduct(created.id, {
        name: `Temp Variant ${timestamp}`,
        slug: `temp-variant-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          {
            id: `temp-${timestamp}`,
            name: "TV2",
            sku: `TV2-${timestamp}`,
            price: 80,
            images: ["http://test.com/tv2.jpg"],
          } as any,
        ],
      });

      const updated = await getProductById(created.id);
      const inserted = updated?.variants.find((v) => v.sku === `TV2-${timestamp}`);
      expect(inserted).toBeDefined();
      expect(inserted?.images[0]?.imageUrl).toBe("http://test.com/tv2.jpg");
    });

    it("should update images for the correct variant when multiple variants exist", async () => {
      const timestamp = Date.now();
      const created = await createProduct({
        name: `Multi Variant Images ${timestamp}`,
        slug: `multi-variant-images-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          { name: "MV1", sku: `MV1-${timestamp}`, price: 70 },
          { name: "MV2", sku: `MV2-${timestamp}`, price: 80 },
        ],
      });

      const product = await getProductById(created.id);
      const firstVariantId = product?.variants[0]?.id as string;
      const secondVariantId = product?.variants[1]?.id as string;

      await updateProduct(created.id, {
        name: `Multi Variant Images ${timestamp}`,
        slug: `multi-variant-images-${timestamp}`,
        categoryId: TEST_CAT_ID,
        variants: [
          { id: firstVariantId, images: [] } as any,
          { id: secondVariantId, images: ["http://test.com/mv2.jpg"] } as any,
        ],
      });

      const updated = await getProductById(created.id);
      const first = updated?.variants.find((v) => v.id === firstVariantId);
      const second = updated?.variants.find((v) => v.id === secondVariantId);

      expect(first?.images.length ?? 0).toBe(0);
      expect(second?.images[0]?.imageUrl).toBe("http://test.com/mv2.jpg");
    });

    describe("cost price history tracking", () => {
      it("should insert a history row when cost price changes", async () => {
        const timestamp = Date.now();
        const created = await createProduct({
          name: `Cost History Change ${timestamp}`,
          slug: `cost-history-change-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              name: "CPH1",
              sku: `CPH1-${timestamp}`,
              price: 200,
              costPrice: 100,
            },
          ],
        });

        const product = await getProductById(created.id);
        const variantId = product?.variants[0].id as string;

        await updateProduct(created.id, {
          name: `Cost History Change ${timestamp}`,
          slug: `cost-history-change-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              id: variantId,
              name: "CPH1",
              sku: `CPH1-${timestamp}`,
              price: 200,
              costPrice: 200,
            } as any,
          ],
        });

        const historyRows = await db
          .select()
          .from(costPriceHistory)
          .where(eq(costPriceHistory.variantId, variantId));

        // The application code inserts the OLD cost price (100),
        // and a DB trigger also fires inserting the NEW cost price (200).
        expect(historyRows.length).toBe(2);
        const costs = historyRows.map((r) => Number(r.costPrice)).sort((a, b) => a - b);
        expect(costs).toEqual([100, 200]);
      });

      it("should NOT insert a history row when cost price is unchanged", async () => {
        const timestamp = Date.now();
        const created = await createProduct({
          name: `Cost History Same ${timestamp}`,
          slug: `cost-history-same-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              name: "CPS1",
              sku: `CPS1-${timestamp}`,
              price: 200,
              costPrice: 100,
            },
          ],
        });

        const product = await getProductById(created.id);
        const variantId = product?.variants[0].id as string;

        await updateProduct(created.id, {
          name: `Cost History Same ${timestamp}`,
          slug: `cost-history-same-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              id: variantId,
              name: "CPS1",
              sku: `CPS1-${timestamp}`,
              price: 200,
              costPrice: 100,
            } as any,
          ],
        });

        const historyRows = await db
          .select()
          .from(costPriceHistory)
          .where(eq(costPriceHistory.variantId, variantId));

        expect(historyRows.length).toBe(0);
      });

      it("should NOT insert a history row when costPrice is omitted from the update", async () => {
        const timestamp = Date.now();
        const created = await createProduct({
          name: `Cost History Omit ${timestamp}`,
          slug: `cost-history-omit-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              name: "CPO1",
              sku: `CPO1-${timestamp}`,
              price: 200,
              costPrice: 100,
            },
          ],
        });

        const product = await getProductById(created.id);
        const variantId = product?.variants[0].id as string;

        await updateProduct(created.id, {
          name: `Cost History Omit ${timestamp}`,
          slug: `cost-history-omit-${timestamp}`,
          categoryId: TEST_CAT_ID,
          variants: [
            {
              id: variantId,
              name: "CPO1",
              sku: `CPO1-${timestamp}`,
              price: 200,
              // costPrice intentionally omitted
            } as any,
          ],
        });

        const historyRows = await db
          .select()
          .from(costPriceHistory)
          .where(eq(costPriceHistory.variantId, variantId));

        expect(historyRows.length).toBe(0);
      });
    });
  });

  describe("getNewArrivals", () => {
    it("should return products created within the last N days up to the limit", async () => {
      const timestamp = Date.now();
      await createProduct({
        name: `New Arrival ${timestamp}`,
        slug: `new-arrival-${timestamp}`,
        categoryId: TEST_CAT_ID,
        isActive: true,
        variants: [{ name: "NA1", sku: `NA1-${timestamp}`, price: 100 }],
      });

      const result = await getNewArrivals(10, 7);

      // The product was just created so it should be within the 7-day window
      const found = result.find((p) => p.slug === `new-arrival-${timestamp}`);
      expect(found).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect the limit parameter", async () => {
      const result = await getNewArrivals(1, 30);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it("should NOT return products created before the date window", async () => {
      const timestamp = Date.now();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90);

      // Insert a product directly with a createdAt 90 days in the past
      const [oldProduct] = await db
        .insert(products)
        .values({
          name: `Old Arrival ${timestamp}`,
          slug: `old-arrival-${timestamp}`,
          categoryId: TEST_CAT_ID,
          isActive: true,
          createdAt: oldDate,
        })
        .returning({ id: products.id });

      // getNewArrivals with a 7-day window — oldProduct was created 90 days ago
      const result = await getNewArrivals(100, 7);
      const resultIds = result.map((p: any) => p.id);
      expect(resultIds).not.toContain(oldProduct.id);
    });
  });
});
