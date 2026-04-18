import { getInternalUser } from "@workspace/database/lib/auth";
import { deleteBanner, updateBanner } from "@workspace/database/services/banner.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    const data = await request.json();
    const banner = await updateBanner(id, {
      ...data,
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : undefined,
      startsAt: data.startsAt !== undefined ? (data.startsAt ? new Date(data.startsAt) : null) : undefined,
      endsAt: data.endsAt !== undefined ? (data.endsAt ? new Date(data.endsAt) : null) : undefined,
    });
    return NextResponse.json({ success: true, banner });
  } catch (error) {
    console.error("Failed to update banner:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật banner." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { id } = await params;
    await deleteBanner(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete banner:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi xóa banner." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
