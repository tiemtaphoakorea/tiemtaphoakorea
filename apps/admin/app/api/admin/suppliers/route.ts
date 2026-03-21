import { getInternalUser } from "@workspace/database/lib/auth";
import {
  createSupplier,
  getActiveSuppliers,
  getSuppliers,
} from "@workspace/database/services/supplier-management.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status");
  const includeInactiveParam = searchParams.get("includeInactive");

  try {
    if (status === "active" || includeInactiveParam === "false") {
      const suppliers = await getActiveSuppliers();
      return NextResponse.json({ suppliers });
    }

    const suppliers = await getSuppliers({ search, includeInactive: true });
    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
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

    const newSupplier = await createSupplier({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      paymentTerms: data.paymentTerms,
      note: data.note,
    });

    return NextResponse.json({ success: true, supplier: newSupplier });
  } catch (error: any) {
    console.error("Failed to create supplier:", error);
    return NextResponse.json(
      { success: false, error: "Đã có lỗi xảy ra khi tạo nhà cung cấp." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
