import { getInternalUser } from "@workspace/database/lib/auth";
import type { PaymentStatus } from "@workspace/database/schema/enums";
import {
  createGoodsReceipt,
  listGoodsReceipts,
  type ReceiptInputItem,
} from "@workspace/database/services/goods-receipt.server";
import type { ReceiptStatusValue } from "@workspace/shared/constants";
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
    const data = await listGoodsReceipts({
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as ReceiptStatusValue | "All") || undefined,
      supplierId: searchParams.get("supplierId") || undefined,
      paymentStatus: (searchParams.get("paymentStatus") || undefined) as PaymentStatus | undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list goods receipts:", error);
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
    const items: ReceiptInputItem[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: "Cần ít nhất 1 sản phẩm" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const created = await createGoodsReceipt({
      purchaseOrderId: body.purchaseOrderId || undefined,
      supplierId: body.supplierId || undefined,
      branchId: body.branchId || undefined,
      invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : undefined,
      invoiceRef: body.invoiceRef || undefined,
      extraCost: body.extraCost,
      discountAmount: body.discountAmount,
      note: body.note || undefined,
      items,
      createdBy: user.profile.id,
    });

    return NextResponse.json({ success: true, receipt: created });
  } catch (error) {
    console.error("Failed to create goods receipt:", error);
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
  }
}
