import { getInternalUser } from "@workspace/database/lib/auth";
import { uploadImage } from "@workspace/database/services/storage.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    const url = await uploadImage(file);
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload thất bại. Vui lòng thử lại sau." },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
