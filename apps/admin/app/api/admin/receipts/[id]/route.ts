import { getInternalUser } from "@workspace/database/lib/auth";
import { getGoodsReceiptById } from "@workspace/database/services/goods-receipt.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const receipt = await getGoodsReceiptById(id);
    if (!receipt) {
      return NextResponse.json(
        { error: "Không tìm thấy phiếu nhập" },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json({ receipt });
  } catch (error) {
    console.error("Failed to fetch goods receipt:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
