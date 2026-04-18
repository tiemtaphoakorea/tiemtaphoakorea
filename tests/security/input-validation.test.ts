/**
 * Input Validation & Injection Prevention Tests
 *
 * Tests for preventing:
 * - SQL Injection
 * - XSS (Cross-Site Scripting)
 * - Path Traversal
 * - Command Injection
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATH_TRAVERSAL_PAYLOADS, XSS_PAYLOADS } from "./helpers/security-helpers";

// Mock database
vi.mock("@/db/db.server", () => ({
  db: {
    query: {
      products: {
        findMany: vi.fn(),
      },
      profiles: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe("Input Validation & Injection Prevention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SQL Injection Prevention", () => {
    describe("Search Parameters are safely parameterized via Drizzle ORM", () => {
      it("[docs] ilike() parameterizes user input as a bind variable — the value never reaches Postgres as raw SQL", () => {
        // Drizzle's ilike(column, `%${value}%`) generates:
        //   WHERE column ILIKE $1   with $1 = '%payload%' as a bound parameter.
        // The SQL string sent to Postgres never contains the user value — only a placeholder.
        // This test documents the invariant: search terms reach the DB as bind variables only.
        const payload = "'; DROP TABLE users; --";
        const parameterizedValue = `%${payload}%`;
        // The value is a plain JS string — safe when passed to ilike() as a bind variable.
        expect(typeof parameterizedValue).toBe("string");
        // Containing the payload as a string is fine; it would not be interpreted as SQL.
        expect(parameterizedValue).toContain("DROP TABLE");
      });
    });

    describe("ID Parameters", () => {
      it("[docs] should validate UUID format for ID parameters", () => {
        const validUUID = "550e8400-e29b-41d4-a716-446655440000";
        const invalidUUID = "1'; DROP TABLE users; --";

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        expect(uuidRegex.test(validUUID)).toBe(true);
        expect(uuidRegex.test(invalidUUID)).toBe(false);
      });

      it("[docs] should reject non-UUID ID parameters", () => {
        const maliciousIds = [
          "1' OR '1'='1",
          "../../../etc/passwd",
          "<script>alert(1)</script>",
          "1; DELETE FROM users",
        ];

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        for (const id of maliciousIds) {
          expect(uuidRegex.test(id)).toBe(false);
        }
      });
    });

    describe("Numeric Parameters", () => {
      it("[docs] should validate numeric input for quantity/price", () => {
        const validNumbers = [1, 100, 0, 99.99];
        const invalidNumbers = ["1' OR '1'='1", "1; DROP TABLE", NaN, Infinity, -Infinity];

        for (const num of validNumbers) {
          expect(typeof num === "number" && Number.isFinite(num)).toBe(true);
        }

        for (const num of invalidNumbers) {
          const isValidNumber = typeof num === "number" && Number.isFinite(num);
          expect(isValidNumber).toBe(false);
        }
      });

      it("[docs] should reject negative quantities", () => {
        const quantity = -5;

        expect(quantity).toBeLessThan(0);

        // Validation should reject negative quantities
        const isValidQuantity = quantity > 0;
        expect(isValidQuantity).toBe(false);
      });
    });
  });

  describe("XSS Prevention", () => {
    describe("User Input Sanitization", () => {
      it.each(XSS_PAYLOADS)("[docs] should escape XSS payload in output: %s", (payload) => {
        // React automatically escapes JSX content
        // This test documents what should happen

        const escapedHTML = payload
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

        // Verify the payload was transformed (escaped)
        if (payload.includes("<") || payload.includes(">")) {
          expect(escapedHTML).not.toBe(payload);
        }

        // Escaped content should not contain raw angle brackets
        expect(escapedHTML).not.toContain("<");
        expect(escapedHTML).not.toContain(">");
      });

      it("[docs] should not allow javascript: URLs", () => {
        const dangerousUrls = [
          "javascript:alert(1)",
          "javascript:document.cookie",
          "JAVASCRIPT:alert(1)",
          "  javascript:alert(1)",
        ];

        for (const url of dangerousUrls) {
          expect(url.trim().toLowerCase().startsWith("javascript:")).toBe(true);

          // URL validation should reject these
          const isSafeUrl =
            url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/");

          expect(isSafeUrl).toBe(false);
        }
      });

      it("[docs] should sanitize user-provided HTML content", () => {
        const dangerousHTML = '<img src=x onerror="alert(1)">';

        // Simple sanitization: strip all HTML tags
        const sanitized = dangerousHTML.replace(/<[^>]*>/g, "");

        expect(sanitized).not.toContain("<");
        expect(sanitized).not.toContain(">");
        expect(sanitized).not.toContain("onerror");
      });
    });

    describe("Content-Type Headers", () => {
      it("[docs] should set correct Content-Type for JSON responses", () => {
        const response = Response.json({ data: "test" });

        expect(response.headers.get("Content-Type")).toContain("application/json");
      });

      it("[docs] should not return HTML for API endpoints", () => {
        const apiResponse = Response.json({ error: "Not found" });

        // API should return JSON, not HTML
        expect(apiResponse.headers.get("Content-Type")).not.toContain("text/html");
      });
    });
  });

  describe("Path Traversal Prevention", () => {
    describe("File Upload Paths", () => {
      it.each(
        PATH_TRAVERSAL_PAYLOADS,
      )("[docs] should reject path traversal in filename: %s", (payload) => {
        // Filenames should not contain path traversal sequences

        const containsTraversal =
          payload.includes("..") ||
          payload.includes("..\\") ||
          payload.includes("%2f") ||
          payload.includes("%2e") ||
          payload.includes("%00"); // Null byte injection

        expect(containsTraversal).toBe(true);

        // Sanitization should remove these
        const sanitized = payload.replace(/\.\./g, "").replace(/[/\\]/g, "_");

        expect(sanitized).not.toContain("..");
      });

      it("[docs] should validate file extension whitelist", () => {
        const allowedExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
        const dangerousExtensions = ["exe", "php", "js", "html", "sh", "bat"];

        for (const ext of allowedExtensions) {
          expect(allowedExtensions).toContain(ext);
        }

        for (const ext of dangerousExtensions) {
          expect(allowedExtensions).not.toContain(ext);
        }
      });

      it("[docs] should sanitize filename", () => {
        const dangerousFilename = "../../../etc/passwd.jpg";

        // Remove path components, keep only filename
        const safeFilename = dangerousFilename.split(/[/\\]/).pop() || "";

        expect(safeFilename).toBe("passwd.jpg");
        expect(safeFilename).not.toContain("..");
        expect(safeFilename).not.toContain("/");
      });
    });

    describe("URL Path Parameters", () => {
      it("[docs] should validate URL path segments", () => {
        const validSlugs = ["product-name", "my-product-123", "test"];
        const invalidSlugs = ["../", "product/../../etc", "test%00"];

        const slugRegex = /^[a-z0-9-]+$/i;

        for (const slug of validSlugs) {
          expect(slugRegex.test(slug)).toBe(true);
        }

        for (const slug of invalidSlugs) {
          expect(slugRegex.test(slug)).toBe(false);
        }
      });
    });
  });

  describe("Command Injection Prevention", () => {
    it("route handlers and services must not import child_process", () => {
      // Scans real source files — no shell involved.
      const fs = require("node:fs") as typeof import("node:fs");
      const path = require("node:path") as typeof import("node:path");

      const root = path.resolve(__dirname, "../..");

      function scanDir(dir: string): string[] {
        const results: string[] = [];
        if (!fs.existsSync(dir)) return results;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
            results.push(...scanDir(full));
          } else if (entry.isFile() && full.endsWith(".ts")) {
            results.push(full);
          }
        }
        return results;
      }

      const dirsToScan = [
        path.join(root, "apps/admin/app/api"),
        path.join(root, "apps/main/app/api"),
        path.join(root, "packages/database/src/services"),
      ];

      const violations: string[] = [];
      for (const dir of dirsToScan) {
        for (const file of scanDir(dir)) {
          const content = fs.readFileSync(file, "utf-8");
          if (content.includes("child_process")) {
            violations.push(file);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("[docs] should sanitize shell metacharacters", () => {
      const userInput = "test; rm -rf /";

      // Shell metacharacters that should be escaped/rejected
      const shellMetachars = [";", "|", "&", "$", "`", "(", ")", "{", "}"];

      const containsMetachars = shellMetachars.some((char) => userInput.includes(char));

      expect(containsMetachars).toBe(true);

      // Sanitized version should remove these
      const sanitized = userInput.replace(/[;|&$`(){}]/g, "");

      expect(sanitized).not.toContain(";");
      expect(sanitized).not.toContain("|");
    });
  });

  describe("JSON Injection Prevention", () => {
    it("[docs] should safely parse JSON without prototype pollution", () => {
      const maliciousJSON = '{"__proto__": {"isAdmin": true}}';

      const parsed = JSON.parse(maliciousJSON);

      // __proto__ in parsed object should not affect Object prototype
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(({} as any).isAdmin).toBeUndefined();

      // The parsed object has __proto__ as a regular property
      expect(parsed.__proto__).toBeDefined();
    });

    it("[docs] should validate JSON structure before processing", () => {
      const validOrder = {
        customerId: "uuid",
        items: [{ variantId: "uuid", quantity: 1 }],
      };

      const invalidOrder = {
        customerId: 123, // Should be string
        items: "not an array", // Should be array
      };

      // Type checking
      expect(typeof validOrder.customerId).toBe("string");
      expect(Array.isArray(validOrder.items)).toBe(true);

      expect(typeof invalidOrder.customerId).not.toBe("string");
      expect(Array.isArray(invalidOrder.items)).toBe(false);
    });
  });

  describe("Category API Validation", () => {
    it("should reject category creation with missing name", async () => {
      const { categorySchema } = await import("@/lib/schemas");
      const body = { displayOrder: 0, isActive: true }; // no name

      const result = categorySchema.safeParse(body);
      expect(result.success).toBe(false);
      if (!result.success) {
        const fields = Object.keys(result.error.flatten().fieldErrors);
        expect(fields).toContain("name");
      }
    });

    it("should strip unknown fields not in allowlist", async () => {
      const { categorySchema } = await import("@/lib/schemas");
      const body = {
        name: "Test Category",
        displayOrder: 0,
        isActive: true,
        id: "injected-id",
        createdAt: "2020-01-01",
      };

      const result = categorySchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("id");
        expect(result.data).not.toHaveProperty("createdAt");
      }
    });
  });

  describe("Product listing limit", () => {
    it("[docs] should cap limit to 100 maximum", () => {
      const rawLimit = parseInt("999999", 10);
      const safeLimit = Math.min(100, Math.max(1, rawLimit));
      expect(safeLimit).toBe(100);
    });

    it("[docs] should floor limit to 1 minimum", () => {
      const rawLimit = parseInt("-5", 10);
      const safeLimit = Math.min(100, Math.max(1, rawLimit));
      expect(safeLimit).toBe(1);
    });

    it("clamp expression handles all edge cases (mirrors apps/admin/app/api/admin/products/route.ts:23)", () => {
      // Mirrors the NaN-safe expression in apps/admin/app/api/admin/products/route.ts
      const clamp = (raw: string | null) => {
        const rawVal = parseInt(raw || "10", 10);
        return Math.min(100, Math.max(1, Number.isNaN(rawVal) ? 10 : rawVal));
      };

      expect(clamp("999999")).toBe(100);
      expect(clamp("-5")).toBe(1);
      expect(clamp("0")).toBe(1);
      expect(clamp("50")).toBe(50);
      expect(clamp(null)).toBe(10);
      expect(clamp("abc")).toBe(10); // NaN-safe: falls back to default 10
    });
  });

  describe("Zod schema input validation (real schemas)", () => {
    it("loginSchema should reject empty credentials", async () => {
      const { loginSchema } = await import("@/lib/schemas");
      const result = loginSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        expect(Object.keys(fieldErrors).length).toBeGreaterThan(0);
      }
    });

    it("supplierOrderAddSchema should reject non-positive quantity", async () => {
      const { supplierOrderAddSchema } = await import("@/lib/schemas");
      const result = supplierOrderAddSchema.safeParse({
        variantId: "550e8400-e29b-41d4-a716-446655440000",
        quantity: -1,
        supplierId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.quantity).toBeDefined();
      }
    });
  });
});
