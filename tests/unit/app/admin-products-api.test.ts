import { BusinessError } from "@workspace/shared/http-status";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getInternalUser } = vi.hoisted(() => ({
  getInternalUser: vi.fn(),
}));

const productService = vi.hoisted(() => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  generateProductSlug: vi.fn(),
  getProductById: vi.fn(),
  getProducts: vi.fn(),
  getProductsWithVariants: vi.fn(),
  updateProduct: vi.fn(),
}));

vi.mock("@workspace/database/lib/auth", () => ({ getInternalUser }));
vi.mock("@workspace/database/services/product.server", () => productService);
vi.mock("@/services/product.server", () => productService);

const mockUser = {
  user: { id: "u1", username: "admin", role: "owner" },
  profile: { id: "u1", role: "owner", isActive: true },
};

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/admin/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes search, stock, category, and pagination filters to the service", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.getProducts.mockResolvedValue({
      data: [],
      metadata: { total: 0, page: 2, limit: 25, totalPages: 0 },
    });
    const { GET } = await import("../../../apps/admin/app/api/admin/products/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/products?search=sku-1&stockStatus=low_stock&categoryId=cat-1&page=2&limit=25",
      ),
    );

    expect(res.status).toBe(200);
    expect(productService.getProducts).toHaveBeenCalledWith({
      search: "sku-1",
      page: 2,
      limit: 25,
      stockStatus: "low_stock",
      categoryId: "cat-1",
    });
  });

  it("loads variant lookup data with in-stock filtering", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.getProductsWithVariants.mockResolvedValue([]);
    const { GET } = await import("../../../apps/admin/app/api/admin/products/route");

    const res = await GET(
      makeRequest(
        "GET",
        "http://localhost/api/admin/products?include=variants&search=tee&limit=10&inStockOnly=true",
      ),
    );

    expect(res.status).toBe(200);
    expect(productService.getProductsWithVariants).toHaveBeenCalledWith({
      search: "tee",
      limit: 10,
      inStockOnly: true,
    });
  });
});

describe("POST /api/admin/products", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes product form fields and accepts legacy stockQuantity as onHand", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.generateProductSlug.mockResolvedValue("created-product");
    productService.createProduct.mockResolvedValue({ id: "product-1" });
    const { POST } = await import("../../../apps/admin/app/api/admin/products/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/products", {
        name: "Created Product",
        description: "Desc",
        categoryId: "",
        basePrice: "120000",
        isFeatured: true,
        variants: [
          {
            name: "Size M",
            sku: "SKU-1",
            price: "125000",
            costPrice: "80000",
            stockQuantity: "12",
            lowStockThreshold: "4",
          },
        ],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(productService.createProduct).toHaveBeenCalledWith({
      name: "Created Product",
      slug: "created-product",
      description: "Desc",
      categoryId: null,
      basePrice: 120000,
      isActive: true,
      isFeatured: true,
      variants: [
        expect.objectContaining({
          sku: "SKU-1",
          price: 125000,
          costPrice: 80000,
          onHand: 12,
          lowStockThreshold: 4,
        }),
      ],
    });
  });

  it("returns 400 for duplicate SKU validation errors", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.generateProductSlug.mockResolvedValue("duplicate-sku");
    productService.createProduct.mockRejectedValue(new Error('SKU "SKU-1" đã tồn tại'));
    const { POST } = await import("../../../apps/admin/app/api/admin/products/route");

    const res = await POST(
      makeRequest("POST", "http://localhost/api/admin/products", {
        name: "Duplicate SKU",
        variants: [{ name: "Default", sku: "SKU-1", price: 1, onHand: 1 }],
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ success: false, error: 'SKU "SKU-1" đã tồn tại' });
  });
});

describe("PUT /api/admin/products/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes update fields and accepts legacy stockQuantity as onHand", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.updateProduct.mockResolvedValue({ id: "product-1" });
    const { PUT } = await import("../../../apps/admin/app/api/admin/products/[id]/route");

    const res = await PUT(
      makeRequest("PUT", "http://localhost/api/admin/products/product-1", {
        name: "Updated Product",
        slug: "updated-product",
        basePrice: "100000",
        variants: [
          {
            id: "variant-1",
            sku: "SKU-1",
            price: "90000",
            costPrice: "70000",
            stockQuantity: "8",
          },
        ],
      }),
      { params: Promise.resolve({ id: "product-1" }) },
    );

    expect(res.status).toBe(200);
    expect(productService.updateProduct).toHaveBeenCalledWith(
      "product-1",
      expect.objectContaining({
        basePrice: 100000,
        variants: [
          expect.objectContaining({
            id: "variant-1",
            price: 90000,
            costPrice: 70000,
            onHand: 8,
          }),
        ],
      }),
    );
  });
});

describe("DELETE /api/admin/products/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 409 when a product cannot be deleted because it has orders", async () => {
    getInternalUser.mockResolvedValue(mockUser);
    productService.deleteProduct.mockRejectedValue(new BusinessError("Không thể xóa sản phẩm"));
    const { DELETE } = await import("../../../apps/admin/app/api/admin/products/[id]/route");

    const res = await DELETE(
      makeRequest("DELETE", "http://localhost/api/admin/products/product-1"),
      { params: Promise.resolve({ id: "product-1" }) },
    );
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body).toEqual({ success: false, error: "Không thể xóa sản phẩm" });
  });
});
