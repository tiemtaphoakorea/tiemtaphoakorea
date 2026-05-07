import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createPurchaseOrder,
  listPurchaseOrders,
  type PurchaseOrderInputItem,
} from "@workspace/database/services/purchase-order.server";
import type { PurchaseOrderStatusValue } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 25);
    const data = await listPurchaseOrders({
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as PurchaseOrderStatusValue | "All") || undefined,
      supplierId: searchParams.get("supplierId") || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list purchase orders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const items: PurchaseOrderInputItem[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cần ít nhất 1 sản phẩm" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const created = await createPurchaseOrder({
      supplierId: body.supplierId || undefined,
      branchId: body.branchId || undefined,
      expectedDate: body.expectedDate ? new Date(body.expectedDate) : undefined,
      note: body.note || undefined,
      items,
      createdBy: user.profile.id,
    });

    return NextResponse.json({ success: true, purchaseOrder: created });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
