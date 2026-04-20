import { getInventoryMovements } from "@workspace/database/services/inventory.server";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const variantId = searchParams.get("variantId") ?? undefined;
  const type = (searchParams.get("type") ?? undefined) as Parameters<
    typeof getInventoryMovements
  >[0]["type"];
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : undefined;
  const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20", 10));

  const result = await getInventoryMovements({ variantId, type, startDate, endDate, page, limit });
  return NextResponse.json(result);
}
