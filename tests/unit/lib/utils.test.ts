import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  endOfMonth,
  formatCurrency,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatRelativeTime,
  formatTime,
  getBreadcrumbName,
  getCurrentMonth,
  getCurrentYear,
  isToday,
  isYesterday,
  startOfMonth,
  subtractDays,
} from "@/lib/utils";
import { cn } from "../../../packages/ui/src/lib/utils";

describe("utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set a fixed date: 2024-01-15T10:00:00Z (Monday)
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("cn", () => {
    it("should merge class names", () => {
      const result = cn("p-2", "p-4", "text-sm");
      expect(result).toContain("p-4");
      expect(result).toContain("text-sm");
    });
  });

  describe("formatCurrency", () => {
    it("should format currency", () => {
      const result = formatCurrency(1000);
      expect(result).toMatch(/1\.000/);
      expect(result).toMatch(/₫/);
    });

    it("should handle string input", () => {
      const result = formatCurrency("2000");
      expect(result).toMatch(/2\.000/);
    });

    it("should handle null/undefined", () => {
      expect(formatCurrency(null)).toMatch(/0/);
      expect(formatCurrency(undefined)).toMatch(/0/);
    });
  });

  describe("Date Formatters", () => {
    // Note: Output depends on system timezone. In this environment, we expect UTC?
    // We will use regex to validate structure to be timezone-safe, or check specific values if possible.
    const testDate = "2024-01-15T10:30:45Z";

    it("should format date (DD/MM/YYYY HH:mm)", () => {
      const result = formatDate(testDate);
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
      // Check day/month/year parts which should be stable across typical timezones for this time
      expect(result).toContain("15/01/2024");
    });

    it("should format date short (DD/MM/YYYY)", () => {
      expect(formatDateShort(testDate)).toBe("15/01/2024");
    });

    it("should format date time (HH:mm:ss DD/MM/YYYY)", () => {
      const result = formatDateTime(testDate);
      expect(result).toMatch(/\d{2}:\d{2}:\d{2} \d{2}\/\d{2}\/\d{4}/);
      expect(result).toContain("15/01/2024");
    });

    it("should format time (HH:mm)", () => {
      const result = formatTime(testDate);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it("should format relative time", () => {
      // Current system time is mocked to 2024-01-15T10:00:00Z
      // A date 1 hour ago
      const pastDate = "2024-01-15T09:00:00Z";
      const result = formatRelativeTime(pastDate);
      // Vietnamese locale is used in lib/utils
      expect(result).toMatch(/trước/);
      expect(result).toContain("giờ");
    });

    it("should return N/A for null/undefined dates", () => {
      expect(formatDate(null)).toBe("N/A");
      expect(formatDateShort(undefined)).toBe("N/A");
      expect(formatDateTime(null)).toBe("N/A");
      expect(formatTime(undefined)).toBe("N/A");
      expect(formatRelativeTime(null)).toBe("N/A");
    });
  });

  describe("Date Helpers", () => {
    it("isToday", () => {
      expect(isToday(new Date())).toBe(true);
      expect(isToday("2024-01-15T10:00:00Z")).toBe(true);
      expect(isToday("2024-01-14T10:00:00Z")).toBe(false);
    });

    it("isYesterday", () => {
      // Mocked today is 2024-01-15
      expect(isYesterday("2024-01-14T10:00:00Z")).toBe(true);
      expect(isYesterday("2024-01-15T10:00:00Z")).toBe(false);
    });

    it("getCurrentMonth", () => {
      // 2024-01-15 -> Month is 1 (January)
      expect(getCurrentMonth()).toBe(1);
    });

    it("getCurrentYear", () => {
      expect(getCurrentYear()).toBe(2024);
    });

    it("startOfMonth", () => {
      const start = startOfMonth("2024-02-15");
      expect(dayjs(start).format("YYYY-MM-DD")).toBe("2024-02-01");
    });

    it("endOfMonth", () => {
      // 2024 is leap year, Feb has 29 days
      const end = endOfMonth("2024-02-15");
      expect(dayjs(end).format("YYYY-MM-DD")).toBe("2024-02-29");
    });

    it("addDays", () => {
      const result = addDays("2024-01-01", 5);
      expect(dayjs(result).format("YYYY-MM-DD")).toBe("2024-01-06");
    });

    it("subtractDays", () => {
      const result = subtractDays("2024-01-06", 5);
      expect(dayjs(result).format("YYYY-MM-DD")).toBe("2024-01-01");
    });
  });

  describe("getBreadcrumbName", () => {
    const routeNames = {
      dashboard: "Bảng điều khiển",
      products: "Sản phẩm",
    };

    it("should return mapped name if exists", () => {
      expect(getBreadcrumbName("dashboard", routeNames)).toBe("Bảng điều khiển");
    });

    it("should return 'Chi tiết' for long segments or numbers", () => {
      expect(getBreadcrumbName("12345", routeNames)).toBe("Chi tiết");
      expect(getBreadcrumbName("verylongsegmentnamethatshouldbereplaced", routeNames)).toBe(
        "Chi tiết",
      );
    });

    it("should capitalize unmapped segments", () => {
      expect(getBreadcrumbName("settings", routeNames)).toBe("Settings");
    });
  });
});
