import { getInternalUser } from "@workspace/database/lib/auth";
import {
  type CreateCollectionData,
  createCollection,
  type HomepageCollectionType,
  listCollectionsForAdmin,
} from "@workspace/database/services/homepage-collection.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

const VALID_TYPES: HomepageCollectionType[] = [
  "manual",
  "best_sellers",
  "new_arrivals",
  "by_category",
];

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const collections = await listCollectionsForAdmin();
    return NextResponse.json({ collections });
  } catch (error) {
    console.error("Failed to list homepage collections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const data = (await request.json()) as Partial<CreateCollectionData>;

    if (!data.type || !VALID_TYPES.includes(data.type as HomepageCollectionType)) {
      return NextResponse.json({ error: "Invalid type" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (!data.title || typeof data.title !== "string" || data.title.trim().length === 0) {
      return NextResponse.json({ error: "Title required" }, { status: HTTP_STATUS.BAD_REQUEST });
    }
    if (data.type === "by_category" && !data.categoryId) {
      return NextResponse.json(
        { error: "categoryId required for by_category" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const collection = await createCollection({
      type: data.type as HomepageCollectionType,
      title: data.title.trim(),
      subtitle: data.subtitle ?? null,
      iconKey: data.iconKey ?? null,
      viewAllUrl: data.viewAllUrl ?? null,
      itemLimit: Number(data.itemLimit) || 8,
      isActive: data.isActive ?? true,
      sortOrder: Number(data.sortOrder) || 0,
      categoryId: data.type === "by_category" ? (data.categoryId ?? null) : null,
      daysWindow: data.type === "new_arrivals" ? Number(data.daysWindow) || 30 : null,
    });

    return NextResponse.json({ success: true, collection }, { status: 201 });
  } catch (error) {
    console.error("Failed to create homepage collection:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
