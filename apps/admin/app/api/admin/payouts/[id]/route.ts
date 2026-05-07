import { getInternalUser } from "@workspace/database/lib/auth";
import { deleteSupplierPayment } from "@workspace/database/services/supplier-payment.server";
import type { IdRouteParams } from "@workspace/database/types/api";
import { ROLE } from "@workspace/shared/constants";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

const DELETE_ROLES: ReadonlyArray<string> = [ROLE.OWNER, ROLE.MANAGER];

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (!DELETE_ROLES.includes(user.profile.role ?? "")) {
    return NextResponse.json(
      { error: "Chỉ Manager hoặc Owner mới được xoá phiếu chi" },
      { status: HTTP_STATUS.FORBIDDEN },
    );
  }

  try {
    const { id } = await params;
    const result = await deleteSupplierPayment(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to delete supplier payment:", error);
    const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
    return NextResponse.json({ error: message }, { status: HTTP_STATUS.BAD_REQUEST });
  }
}
