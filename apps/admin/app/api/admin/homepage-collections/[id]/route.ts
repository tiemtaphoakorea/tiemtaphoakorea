import { getInternalUser } from "@workspace/database/lib/auth";
import {
  deleteCollection,
  getCollection,
  type UpdateCollectionData,
  updateCollection,
} from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { id } = await ctx.params;
  const collection = await getCollection(id);
  if (!collection) {
    return NextResponse.json({ error: "Not found" }, { status: HTTP_STATUS.NOT_FOUND });
  }
  return NextResponse.json({ collection });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await ctx.params;
    const data = (await request.json()) as UpdateCollectionData;
    const collection = await updateCollection(id, data);
    return NextResponse.json({ success: true, collection });
  } catch (error) {
    console.error("Failed to update homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await ctx.params;
    await deleteCollection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
