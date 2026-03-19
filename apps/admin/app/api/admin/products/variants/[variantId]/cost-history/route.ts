import { getInternalUser } from "@repo/database/lib/auth";
import { getCostPriceHistory } from "@repo/database/services/product.server";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const internalUser = await getInternalUser(request);
  if (!internalUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { variantId } = await params;
  const history = await getCostPriceHistory(variantId);
  return NextResponse.json({ history });
}
