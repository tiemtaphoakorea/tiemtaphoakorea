import { requireRole } from "@workspace/database/lib/auth";
import { updateCustomer } from "@workspace/database/services/customer.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  try {
    await requireRole(request, [ROLE.OWNER, ROLE.MANAGER]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const body = await request.json();
    const { isActive } = body;

    if (isActive !== true && isActive !== false) {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: HTTP_STATUS.BAD_REQUEST },
      );
    }

    const { id } = await params;
    const updatedProfile = await updateCustomer(id, {
      isActive,
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
