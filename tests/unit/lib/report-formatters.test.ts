import { describe, expect, it } from "vitest";

import { formatPnlMetricValue, PNL_METRIC_LABELS } from "../../../apps/admin/lib/report-formatters";

describe("report-formatters", () => {
  it("labels P&L missing-cost exception metrics", () => {
    expect(PNL_METRIC_LABELS).toMatchObject({
      excludedRevenue: "Doanh thu chưa tính vào P&L",
      missingCostItems: "Dòng thiếu giá vốn",
      missingCostOrderCount: "Đơn thiếu giá vốn",
      missingCostRate: "Tỷ lệ dòng thiếu giá vốn",
    });
  });

  it("formats P&L counts, rates, and money by metric kind", () => {
    expect(formatPnlMetricValue("orderCount", 2)).toBe("2");
    expect(formatPnlMetricValue("missingCostOrderCount", 3)).toBe("3");
    expect(formatPnlMetricValue("missingCostRate", 0.125)).toBe("12.5%");
    expect(formatPnlMetricValue("excludedRevenue", 150_000)).toBe("150.000");
  });
});
