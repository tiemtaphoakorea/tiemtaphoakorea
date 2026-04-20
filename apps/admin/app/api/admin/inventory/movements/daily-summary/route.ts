import { getInventoryDailySummary } from "@workspace/database/services/inventory.server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : undefined;
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;

  const rows = await getInventoryDailySummary({ variantId, startDate, endDate });
  return NextResponse.json({ data: rows });
}
