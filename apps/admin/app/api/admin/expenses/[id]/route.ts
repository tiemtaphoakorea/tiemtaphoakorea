import { getInternalUser } from "@repo/database/lib/auth";
import { deleteExpense } from "@repo/database/services/finance.server";
import type { IdRouteParams } from "@repo/database/types/api";
import { ROLE } from "@repo/shared/constants";
import { HTTP_STATUS } from "@repo/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest, { params }: IdRouteParams) {
  const user = await getInternalUser(request);

  // Expenses are Owner-only
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }
  if (user.profile.role !== ROLE.OWNER) {
    return NextResponse.json({ error: "Forbidden" }, { status: HTTP_STATUS.FORBIDDEN });
  }

  try {
    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
