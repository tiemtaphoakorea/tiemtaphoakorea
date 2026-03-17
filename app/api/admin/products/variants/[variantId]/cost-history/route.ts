// Since this is Next.js 15+ (from package.json), we use `NextResponse` or just return Response.
import { NextResponse } from "next/server";
import { getCostPriceHistory } from "@/services/product.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }, // Params is a Promise in Next.js 15
) {
  const { variantId } = await params;
  const history = await getCostPriceHistory(variantId);
  return NextResponse.json({ history });
}
