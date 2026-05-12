import { getOpeningStock, updateOpeningStock } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

// GET /api/admin/inventory/opening-stock?variantId=...
// Returns the current opening-stock quantity for a variant (or null if none).
export async function GET(req: NextRequest) {
  const auth = await requireApiUser(req, "owner");
  if (!auth.ok) return auth.response;
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
  const auth = await requireApiUser(req, "owner");
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let body: {
    variantId?: string;
    newQuantity?: number;
    unitCost?: number;
    effectiveDate?: string;
    note?: string;
  };
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
      unitCost: typeof body.unitCost === "number" ? body.unitCost : 0,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      note: body.note,
      userId: user.profile.id,
    });
    return NextResponse.json(result, { status: HTTP_STATUS.OK });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update opening stock";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
