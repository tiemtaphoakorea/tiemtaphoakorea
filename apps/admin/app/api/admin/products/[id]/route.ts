import { getInternalUser } from "@repo/database/lib/auth";
import {
  deleteProduct,
  getProductById,
  type UpdateProductData,
  updateProduct,
} from "@repo/database/services/product.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { BusinessError, HTTP_STATUS } from "@repo/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Product ID required" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  try {
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function PUT(request: Request, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const data = await request.json();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing ID" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const productData: UpdateProductData = {
      name: data.name as string,
      slug: data.slug || "",
      description: data.description as string,
      categoryId: (data.categoryId as string) || null,
      basePrice: Number(data.basePrice || 0),
      isActive: data.isActive !== false,
      variants: (data.variants || []).map((v: any) => ({
        ...v,
        price: v.price !== undefined ? Number(v.price) : undefined,
        costPrice: v.costPrice !== undefined ? Number(v.costPrice) : undefined,
        stockQuantity: v.stockQuantity !== undefined ? Number(v.stockQuantity) : undefined,
        lowStockThreshold:
          v.lowStockThreshold !== undefined ? Number(v.lowStockThreshold) : undefined,
      })),
    };

    const product = await updateProduct(id, productData);
    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("Failed to update product:", error);
    const errorMessage = error?.message || "";
    const isValidation =
      errorMessage === "Quantity cannot be negative" ||
      errorMessage.toLowerCase().includes("negative") ||
      errorMessage.includes("SKU") ||
      errorMessage.includes("đã tồn tại");

    return NextResponse.json(
      {
        success: false,
        error: isValidation ? errorMessage : "Đã có lỗi xảy ra khi cập nhật sản phẩm.",
      },
      {
        status: isValidation ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}

export async function DELETE(request: Request, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { success: false, error: "Missing ID" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    await deleteProduct(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { success: false, error: error?.message ?? "Đã có lỗi xảy ra khi xóa sản phẩm." },
      {
        status:
          error instanceof BusinessError ? HTTP_STATUS.CONFLICT : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
