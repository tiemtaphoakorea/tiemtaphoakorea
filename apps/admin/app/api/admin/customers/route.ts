import { getInternalUser } from "@workspace/database/lib/auth";
import { createCustomer, getCustomers } from "@workspace/database/services/customer.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);

  try {
    const result = await getCustomers({ search, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal Server Error",
      },
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
    const result = await createCustomer(data);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("Failed to create customer:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi tạo khách hàng." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
