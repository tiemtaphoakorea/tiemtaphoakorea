import { applyOpeningStockEntries } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

type BulkRow = {
  variantId?: string;
  quantity?: number;
  unitCost?: number;
  effectiveDate?: string;
  note?: string | null;
};

export async function PATCH(req: NextRequest) {
  const auth = await requireApiUser(req, "owner");
  if (!auth.ok) return auth.response;

  let body: { entries?: BulkRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  if (!Array.isArray(body.entries) || body.entries.length === 0) {
    return NextResponse.json({ error: "entries required" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  try {
    const entries = body.entries.map((entry) => {
      const effectiveDate = entry.effectiveDate ? new Date(entry.effectiveDate) : new Date();
      if (!entry.variantId) throw new Error("variantId required");
      if (typeof entry.quantity !== "number") throw new Error("quantity required");
      if (typeof entry.unitCost !== "number") throw new Error("unitCost required");
      return {
        variantId: entry.variantId,
        quantity: entry.quantity,
        unitCost: entry.unitCost,
        effectiveDate,
        note: entry.note,
      };
    });
    const results = await applyOpeningStockEntries({ entries, userId: auth.user.profile.id });
    return NextResponse.json({ success: true, results }, { status: HTTP_STATUS.OK });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to apply opening stock";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
