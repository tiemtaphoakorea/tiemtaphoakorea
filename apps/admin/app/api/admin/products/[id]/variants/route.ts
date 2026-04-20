import { db } from "@workspace/database/db";
import { getInternalUser } from "@workspace/database/lib/auth";
import { costPriceHistory, productVariants } from "@workspace/database/schema/products";
import type { IdRouteParams } from "@workspace/database/types/api";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
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
        onHand: Number(body.onHand || 0),
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
