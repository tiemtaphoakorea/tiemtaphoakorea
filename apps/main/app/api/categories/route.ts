import { getCategories } from "@workspace/database/services/category.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function GET() {
  const roots = await getCategories();
  const active = roots.filter((c) => c.isActive);
  return NextResponse.json(active, { status: HTTP_STATUS.OK });
}
