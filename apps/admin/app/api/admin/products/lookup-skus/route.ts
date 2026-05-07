import { getInternalUser } from "@workspace/database/lib/auth";
import { lookupVariantsBySkus } from "@workspace/database/services/product.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

  const skus = (body as { skus?: unknown })?.skus;
  if (!Array.isArray(skus) || skus.some((s) => typeof s !== "string")) {
    return NextResponse.json(
      { error: "skus must be an array of strings" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const matched = await lookupVariantsBySkus(skus as string[]);
    return NextResponse.json({
      variants: matched.map((v) => ({
        id: v.id,
        productId: v.productId,
        productName: v.product?.name ?? "",
        sku: v.sku,
        name: v.name,
        price: v.price,
        onHand: v.onHand,
        reserved: v.reserved,
      })),
    });
  } catch (error) {
    console.error("Failed to lookup SKUs:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tra cứu SKU." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
