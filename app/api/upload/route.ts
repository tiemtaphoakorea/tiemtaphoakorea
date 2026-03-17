import { NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { ROLE } from "@/lib/constants";
import { HTTP_STATUS } from "@/lib/http-status";
import { uploadImage } from "@/services/storage.server";

export async function POST(request: Request) {
  const user = await getInternalUser();

  // Only owner and manager can upload files
  if (!user || ![ROLE.OWNER, ROLE.MANAGER].includes(user.profile.role as any)) {
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
