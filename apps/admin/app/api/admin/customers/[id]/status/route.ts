import { getInternalUser } from "@repo/database/lib/auth";
import { updateCustomer } from "@repo/database/services/customer.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { isActive } = body;

    if (isActive === undefined) {
      return NextResponse.json({ error: "Missing isActive" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const { id } = await params;
    const updatedProfile = await updateCustomer(id, {
      isActive: Boolean(isActive),
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Failed to update customer status:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi cập nhật trạng thái." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
