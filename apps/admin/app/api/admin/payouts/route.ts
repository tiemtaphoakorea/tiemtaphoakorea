import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createSupplierPayment,
  listSupplierPayments,
} from "@workspace/database/services/supplier-payment.server";
import type { PaymentMethodValue } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { beginIdempotency } from "@/lib/idempotency";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 25);
    const data = await listSupplierPayments({
      supplierId: searchParams.get("supplierId") || undefined,
      receiptId: searchParams.get("receiptId") || undefined,
      method: (searchParams.get("method") as PaymentMethodValue | null) || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 25,
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to list supplier payments:", error);
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
    if (!body.supplierId || !body.amount || !body.method) {
      return NextResponse.json(
        { error: "Thiếu NCC, số tiền hoặc phương thức thanh toán" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { clientToken, ...input } = body;

    // Idempotency: replay returns cached response; conflict surfaces 409.
    // Payload excludes clientToken itself so replay matches on actual intent.
    const idem = await beginIdempotency({
      clientToken,
      resourceType: "payout",
      payload: {
        supplierId: input.supplierId,
        receiptId: input.receiptId ?? null,
        amount: String(input.amount),
        method: input.method,
        referenceCode: input.referenceCode ?? null,
        paidAt: input.paidAt ?? null,
        note: input.note ?? null,
      },
    });
    if ("replay" in idem) return idem.replay;

    const payment = await createSupplierPayment({
      supplierId: input.supplierId,
      receiptId: input.receiptId || undefined,
      amount: String(input.amount),
      method: input.method as PaymentMethodValue,
      referenceCode: input.referenceCode || undefined,
      paidAt: input.paidAt ? new Date(input.paidAt) : undefined,
      note: input.note || undefined,
      createdBy: user.profile.id,
    });

    const response = { success: true, payment };
    await idem.finalize(response, payment.id);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to create supplier payment:", error);
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
