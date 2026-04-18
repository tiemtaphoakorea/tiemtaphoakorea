import { getInternalUser } from "@workspace/database/lib/auth";
import {
  type CreateProductData,
  createProduct,
  deleteProduct,
  generateProductSlug,
  getProducts,
  getProductsWithVariants,
} from "@workspace/database/services/product.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const rawPage = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const rawLimit = parseInt(searchParams.get("limit") || "10", 10);
  const limit = Math.min(100, Math.max(1, Number.isNaN(rawLimit) ? 10 : rawLimit));
  const stockStatus = searchParams.get("stockStatus") || undefined;
  const include = searchParams.get("include");

  try {
    if (include === "variants") {
      const products = await getProductsWithVariants();
      return NextResponse.json({ products });
    }

    const result = await getProducts({ search, page, limit, stockStatus });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải danh sách sản phẩm." },
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
    const data = await request.json();
    const slug = await generateProductSlug(data.name as string);

    const productData: CreateProductData = {
      name: data.name as string,
      slug,
      description: data.description as string,
      categoryId: (data.categoryId as string) || null,
      basePrice: Number(data.basePrice || 0),
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured === true,
      variants: (data.variants || []).map((v: any) => ({
        ...v,
        price: Number(v.price),
        costPrice: Number(v.costPrice || 0),
        stockQuantity: Number(v.stockQuantity || 0),
        lowStockThreshold:
          v.lowStockThreshold !== undefined ? Number(v.lowStockThreshold) : undefined,
      })),
    };

    // createProduct returns the complete product with all relations
    // from within the same transaction - no need for re-fetch
    const createdProduct = await createProduct(productData);

    // Revalidate both admin and public catalog pages
    revalidatePath("/admin/products");
    revalidatePath("/products");

    return NextResponse.json({
      success: true,
      product: createdProduct,
    });
  } catch (error: any) {
    console.error("Failed to create product:", error);
    const errorMessage = error?.message || "";
    const isValidation =
      errorMessage.includes("SKU") ||
      errorMessage.includes("đã tồn tại") ||
      errorMessage.includes("Quantity cannot be negative");

    return NextResponse.json(
      {
        success: false,
        error: isValidation ? errorMessage : "Đã có lỗi xảy ra khi tạo sản phẩm.",
      },
      {
        status: isValidation ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const { ids } = (body as { ids?: unknown }) ?? {};

  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids must be a non-empty array of strings" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const deleted: string[] = [];
  const failed: string[] = [];

  for (const id of ids as string[]) {
    try {
      await deleteProduct(id);
      deleted.push(id);
    } catch (error) {
      console.error(`Failed to delete product ${id}:`, error);
      failed.push(id);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");

  return NextResponse.json({ deleted: deleted.length, failed });
}
