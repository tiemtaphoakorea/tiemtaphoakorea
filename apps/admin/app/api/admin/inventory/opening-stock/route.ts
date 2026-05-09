import { getInternalUser } from "@workspace/database/lib/auth";
import { getOpeningStock, updateOpeningStock } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

// GET /api/admin/inventory/opening-stock?variantId=...
// Returns the current opening-stock quantity for a variant (or null if none).
export async function GET(req: NextRequest) {
  const user = await getInternalUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  const variantId = req.nextUrl.searchParams.get("variantId");
  if (!variantId) {
    return NextResponse.json({ error: "variantId required" }, { status: HTTP_STATUS.BAD_REQUEST });
  }
  const result = await getOpeningStock(variantId);
  return NextResponse.json(result, { status: HTTP_STATUS.OK });
}

// PATCH /api/admin/inventory/opening-stock
// Body: { variantId: string; newQuantity: number }
// Sets the opening-stock movement quantity, re-chains all subsequent movements,
// and syncs product_variants.on_hand. Owner/manager only.
export async function PATCH(req: NextRequest) {
  const user = await getInternalUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const role = user.profile.role;
  if (role !== "owner" && role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  let body: { variantId?: string; newQuantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const { variantId, newQuantity } = body;
  if (
    !variantId ||
    typeof newQuantity !== "number" ||
    !Number.isInteger(newQuantity) ||
    newQuantity < 0
  ) {
    return NextResponse.json(
      { error: "variantId and non-negative integer newQuantity required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  try {
    const result = await updateOpeningStock({
      variantId,
      newQuantity,
      userId: user.profile.id,
    });
    return NextResponse.json(result, { status: HTTP_STATUS.OK });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update opening stock";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
