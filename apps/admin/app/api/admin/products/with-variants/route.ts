import { getInternalUser } from "@workspace/database/lib/auth";
import { getProductsWithVariants } from "@workspace/database/services/product.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const products = await getProductsWithVariants();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Failed to fetch products with variants:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tải thông tin sản phẩm." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
