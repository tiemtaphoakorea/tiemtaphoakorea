import { getInternalUser } from "@workspace/database/lib/auth";
import { adjustInventory } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const user = await getInternalUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await req.json();
  const { variantId, quantity, note } = body as {
    variantId: string;
    quantity: number;
    note?: string;
  };

  if (!variantId || typeof quantity !== "number" || quantity === 0) {
    return NextResponse.json(
      { error: "variantId and non-zero quantity required" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const movement = await adjustInventory({
    variantId,
    quantity,
    note,
    userId: user.profile.id,
  });

  return NextResponse.json(movement, { status: 201 });
}
