import { previewOpeningStockCsv } from "@workspace/database/services/inventory.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { type NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireApiUser(req, "owner");
  if (!auth.ok) return auth.response;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const csvText = await file.text();
  const result = await previewOpeningStockCsv(csvText);
  return NextResponse.json(result, { status: HTTP_STATUS.OK });
}
