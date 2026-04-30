import { getInternalUser } from "@workspace/database/lib/auth";
import { getSetting, upsertSetting } from "@workspace/database/services/settings.server";
import { HTTP_STATUS } from "@workspace/shared/http-status";
import { NextResponse } from "next/server";

export type CustomerTierConfig = {
  loyalMinOrders: number;
  loyalMinSpent: number;
  frequentMinOrders: number;
  frequentMinSpent: number;
};

const DEFAULT_CONFIG: CustomerTierConfig = {
  loyalMinOrders: 10,
  loyalMinSpent: 5_000_000,
  frequentMinOrders: 5,
  frequentMinSpent: 2_000_000,
};

const SETTING_KEY = "customer_tier_config";

export async function GET(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const stored = await getSetting<CustomerTierConfig>(SETTING_KEY);
  return NextResponse.json(stored ?? DEFAULT_CONFIG);
}

export async function PUT(request: Request) {
  const user = await getInternalUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const body = await request.json();
  const config: CustomerTierConfig = {
    loyalMinOrders: Number(body.loyalMinOrders),
    loyalMinSpent: Number(body.loyalMinSpent),
    frequentMinOrders: Number(body.frequentMinOrders),
    frequentMinSpent: Number(body.frequentMinSpent),
  };

  await upsertSetting(SETTING_KEY, config);
  return NextResponse.json(config);
}
