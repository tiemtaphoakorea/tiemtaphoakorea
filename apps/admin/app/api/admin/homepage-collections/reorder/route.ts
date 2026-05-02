import { getInternalUser } from "@workspace/database/lib/auth";
import { reorderCollections } from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "ids must be an array" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }
    await reorderCollections(ids);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reorder homepage collections:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
