import type { BadgeTone } from "@/components/admin/shared/status-badge";

export type CustomerTierConfig = {
  loyalMinOrders: number;
  loyalMinSpent: number;
  frequentMinOrders: number;
  frequentMinSpent: number;
};

export type CustomerTier = {
  label: string;
  tone: BadgeTone;
};

export const DEFAULT_TIER_CONFIG: CustomerTierConfig = {
  loyalMinOrders: 10,
  loyalMinSpent: 5_000_000,
  frequentMinOrders: 5,
  frequentMinSpent: 2_000_000,
};

export function resolveCustomerTier(
  totalSpent: number,
  orderCount: number,
  config: CustomerTierConfig | null | undefined,
): CustomerTier {
  const cfg = config ?? DEFAULT_TIER_CONFIG;
  if (orderCount >= cfg.loyalMinOrders && totalSpent >= cfg.loyalMinSpent) {
    return { label: "Thân thiết", tone: "amber" };
  }
  if (orderCount >= cfg.frequentMinOrders && totalSpent >= cfg.frequentMinSpent) {
    return { label: "Thường xuyên", tone: "indigo" };
  }
  return { label: "Mới", tone: "gray" };
}
