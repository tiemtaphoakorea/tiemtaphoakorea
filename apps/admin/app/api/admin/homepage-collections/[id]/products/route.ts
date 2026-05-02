import { getInternalUser } from "@workspace/database/lib/auth";
import { setCollectionProducts } from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await ctx.params;
    const { productIds } = await request.json();
    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: "productIds must be an array" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    await setCollectionProducts(id, productIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set collection products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
