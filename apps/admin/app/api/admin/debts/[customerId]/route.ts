import { getInternalUser } from "@workspace/database/lib/auth";
import { getCustomerDebt } from "@workspace/database/services/debt.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const { customerId } = await params;
    const result = await getCustomerDebt(customerId);
    if (!result) {
      return NextResponse.json({ error: "Customer not found" }, { status: HTTP_STATUS.NOT_FOUND });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch customer debt:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
