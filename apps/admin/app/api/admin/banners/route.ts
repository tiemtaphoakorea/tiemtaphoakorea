import { getInternalUser } from "@workspace/database/lib/auth";
import { createBanner, getAllBannersForAdmin } from "@workspace/database/services/banner.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const banners = await getAllBannersForAdmin();
    return NextResponse.json({ banners });
  } catch (error) {
    console.error("Failed to fetch banners:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
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
    const data = await request.json();
    const banner = await createBanner({
      type: data.type ?? "custom",
      categoryId: data.categoryId ?? null,
      imageUrl: data.imageUrl ?? null,
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      badgeText: data.badgeText ?? null,
      ctaLabel: data.ctaLabel ?? null,
      ctaUrl: data.ctaUrl ?? null,
      ctaSecondaryLabel: data.ctaSecondaryLabel ?? null,
      discountTag: data.discountTag ?? null,
      discountTagSub: data.discountTagSub ?? null,
      accentColor: data.accentColor ?? null,
      isActive: data.isActive ?? true,
      sortOrder: Number(data.sortOrder) || 0,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    });
    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error) {
    console.error("Failed to create banner:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi tạo banner." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
