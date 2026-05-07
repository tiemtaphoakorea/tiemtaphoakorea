import { getInternalUser } from "@workspace/database/lib/auth";
import { getPurchaseOrderById } from "@workspace/database/services/purchase-order.server";
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
    const purchaseOrder = await getPurchaseOrderById(id);
    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn nhập" },
        { status: HTTP_STATUS.NOT_FOUND },
      );
    }
    return NextResponse.json({ purchaseOrder });
  } catch (error) {
    console.error("Failed to fetch purchase order:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
