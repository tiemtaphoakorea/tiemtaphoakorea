import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createSupplierOrders,
  getSupplierOrders,
} from "@workspace/database/services/supplier.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "All";

    const orders = await getSupplierOrders({ search, status });
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("Failed to fetch supplier orders:", error);
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
    const { variantId, quantity, expectedDate, note, supplierId } = body;

    if (!variantId || quantity == null || quantity === "") {
      return NextResponse.json(
        { error: "Missing variantId or quantity" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const parsedQuantity = parseInt(quantity, 10);
    if (Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be a positive integer" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const newOrders = await createSupplierOrders({
      items: [
        {
          variantId,
          quantity: parsedQuantity,
          expectedDate: expectedDate ? new Date(expectedDate) : undefined,
          note,
        },
      ],
      createdBy: user.profile.id,
      supplierId,
    });

    return NextResponse.json({ success: true, supplierOrder: newOrders[0] });
  } catch (error: any) {
    console.error("Failed to create supplier order:", error);
    return NextResponse.json(
      { error: "Đã có lỗi xảy ra khi tạo đơn nhập hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
