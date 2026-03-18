import { NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";
import { getCostPriceHistory } from "@/services/product.server";

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
