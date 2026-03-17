import { NextResponse } from "next/server";
import { db } from "@/db/db.server";
import { costPriceHistory, productVariants } from "@/db/schema/products";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";
import type { IdRouteParams } from "@/types/api";

export async function POST(request: Request, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user || !["owner", "admin"].includes(user.profile.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { id: productId } = await params;
  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();

    const costPrice = Number(body.costPrice || 0);
    const retailPrice = Number(body.retailPrice || body.price || 0);

    // Validation for TC-ACC-007
    if (costPrice > retailPrice) {
      return NextResponse.json(
        { error: "Cost price cannot be higher than retail price" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        sku: body.sku,
        name: body.name || "Variant",
        price: String(retailPrice),
        costPrice: String(costPrice),
        stockQuantity: Number(body.stockQuantity || 0),
        lowStockThreshold: body.lowStockThreshold ? Number(body.lowStockThreshold) : undefined,
        isActive: true,
      })
      .returning();

    // Add cost history
    if (costPrice > 0) {
      await db.insert(costPriceHistory).values({
        variantId: variant.id,
        costPrice: String(costPrice),
        effectiveDate: new Date(),
        note: "Initial cost",
        createdBy: user.profile.id,
      });
    }

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    console.error("Failed to create variant:", error);
    const message = "Đã có lỗi xảy ra khi lưu biến thể sản phẩm.";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
