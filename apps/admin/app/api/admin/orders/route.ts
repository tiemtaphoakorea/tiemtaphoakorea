import { getInternalUser } from "@workspace/database/lib/auth";
import { createOrder, getOrders } from "@workspace/database/services/order.server";
import {
  FULFILLMENT_STATUS,
  type FulfillmentStatusValue,
  PAYMENT_STATUS,
  type PaymentStatusValue,
} from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { getPaginationParams } from "@workspace/shared/pagination";
import { NextResponse } from "next/server";
import { beginIdempotency } from "@/lib/idempotency";

const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS) as readonly PaymentStatusValue[];
const FULFILLMENT_STATUS_VALUES = Object.values(
  FULFILLMENT_STATUS,
) as readonly FulfillmentStatusValue[];

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const rawPaymentStatus = searchParams.get("paymentStatus");
  const paymentStatus =
    rawPaymentStatus && PAYMENT_STATUS_VALUES.includes(rawPaymentStatus as PaymentStatusValue)
      ? (rawPaymentStatus as PaymentStatusValue)
      : undefined;
  const rawFulfillmentStatus = searchParams.get("fulfillmentStatus");
  const fulfillmentStatus =
    rawFulfillmentStatus &&
    FULFILLMENT_STATUS_VALUES.includes(rawFulfillmentStatus as FulfillmentStatusValue)
      ? (rawFulfillmentStatus as FulfillmentStatusValue)
      : undefined;
  const debtOnly = searchParams.get("debtOnly") === "true";
  const customerId = searchParams.get("customerId") || undefined;
  const { page, limit } = getPaginationParams(request);

  try {
    const result = await getOrders({
      search,
      paymentStatus,
      fulfillmentStatus,
      debtOnly,
      customerId,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const {
      customerId,
      customerPhone,
      customerName,
      items,
      note,
      deliveryPreference,
      clientToken,
      shippingName,
      shippingPhone,
      shippingAddress,
    } = body;

    const idem = await beginIdempotency({
      clientToken,
      resourceType: "order",
      payload: {
        customerId,
        customerPhone,
        customerName,
        items,
        note,
        deliveryPreference,
        shippingName,
        shippingPhone,
        shippingAddress,
      },
    });
    if ("replay" in idem) return idem.replay;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing items" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const validItems = items.every((item: any) => Number(item?.quantity ?? 0) > 0);
    if (!validItems) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      const name = typeof customerName === "string" ? customerName.trim() : "";
      if (!name) {
        return NextResponse.json(
          {
            error: "customerName is required when customerId is not provided",
          },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }
      const phone =
        typeof customerPhone === "string" && customerPhone.trim() !== ""
          ? customerPhone.trim()
          : undefined;
      resolvedCustomerId = { name, phone };
    }

    const payload = {
      customerId: resolvedCustomerId,
      items: items.map((item: any) => ({
        variantId: item.variantId,
        quantity: Number(item.quantity || 0),
        ...(item.customPrice != null && { customPrice: Number(item.customPrice) }),
      })),
      note,
      userId: user.profile.id,
      deliveryPreference,
      shippingName,
      shippingPhone,
      shippingAddress,
    };

    let result:
      | {
          order: any;
          itemsNeedingStock?: Array<{
            sku: string;
            name: string;
            quantityToOrder: number;
          }>;
        }
      | undefined;
    let lastError: Error | null = null;
    const maxAttempts = 4; // Increased from 2 to 4 to handle database consistency delays
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        result = await createOrder(payload);
        break;
      } catch (err: any) {
        lastError = err;
        const isVariantsNotFound = err?.message?.includes("Variants not found") ?? false;
        if (isVariantsNotFound && attempt < maxAttempts) {
          const delay = 500 * attempt;
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    if (!result) throw lastError ?? new Error("Failed to create order");

    // Ensure transaction is committed and visible to subsequent reads
    await new Promise((r) => setTimeout(r, 100));

    const { order, itemsNeedingStock } = result;
    const response = {
      success: true,
      order,
      itemsNeedingStock: itemsNeedingStock?.length ? itemsNeedingStock : undefined,
    };

    if (order?.id) {
      await idem.finalize(response, order.id);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Failed to create order:", error?.message, {
      code: error?.code,
      constraint: error?.constraint,
      detail: error?.detail,
    });

    const errorMessage = error?.message || "";
    const isDomainError =
      errorMessage.includes("Variants not found") ||
      errorMessage.includes("Quantity") ||
      errorMessage.includes("Order not found") ||
      errorMessage.includes("Insufficient stock") ||
      errorMessage.includes("Không đủ tồn kho");

    return NextResponse.json(
      {
        error: isDomainError
          ? errorMessage
          : "Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.",
      },
      {
        status: isDomainError ? HTTP_STATUS.BAD_REQUEST : HTTP_STATUS.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
