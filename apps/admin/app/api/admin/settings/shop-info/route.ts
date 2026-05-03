import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export type ShopInfoConfig = {
  name: string;
  address: string;
  phone: string;
  taxId: string;
  seoDescription: string;
  seoKeywords: string;
};

const DEFAULT_CONFIG: ShopInfoConfig = {
  name: "",
  address: "",
  phone: "",
  taxId: "",
  seoDescription: "",
  seoKeywords: "",
};

const SETTING_KEY = "shop_info";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const stored = await getSetting<ShopInfoConfig>(SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json();
  const config: ShopInfoConfig = {
    name: String(body.name ?? "").trim(),
    address: String(body.address ?? "").trim(),
    phone: String(body.phone ?? "").trim(),
    taxId: String(body.taxId ?? "").trim(),
    seoDescription: String(body.seoDescription ?? "")
      .slice(0, 160)
      .trim(),
    seoKeywords: String(body.seoKeywords ?? "").trim(),
  };

  await upsertSetting(SETTING_KEY, config);
  return NextResponse.json(config);
}
