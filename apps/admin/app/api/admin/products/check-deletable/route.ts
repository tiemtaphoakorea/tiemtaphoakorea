import { getInternalUser } from "@workspace/database/lib/auth";
import { checkProductsDeletable } from "@workspace/database/services/product.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: HTTP_STATUS.BAD_REQUEST });
  }

  const { ids } = (body as { ids?: unknown }) ?? {};

  if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "ids must be an array of strings" },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const result = await checkProductsDeletable(ids as string[]);
  return NextResponse.json(result);
}
