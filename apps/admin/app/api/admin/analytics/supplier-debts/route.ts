import { getInternalUser } from "@workspace/database/lib/auth";
import { getSupplierDebtsAggregate } from "@workspace/database/services/supplier-payment.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const data = await getSupplierDebtsAggregate();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load supplier debts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
