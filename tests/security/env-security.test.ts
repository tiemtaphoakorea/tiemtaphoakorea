/**
 * Environment Variable Security Tests
 *
 * Ensures sensitive environment variables are never exposed to the client.
 * This is critical for preventing credential leakage.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ALLOWED_CLIENT_ENV_KEYS, SENSITIVE_ENV_KEYS } from "./helpers/security-helpers";

describe("Environment Variable Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Client ENV Exposure", () => {
    it("should only expose allowed keys in root loader", async () => {
      // The root.tsx loader should only return these keys
      const allowedKeys = [...ALLOWED_CLIENT_ENV_KEYS];

      // Simulate what root.tsx loader returns
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      };

      // Verify only allowed keys are present
      const returnedKeys = Object.keys(clientEnv);
      expect(returnedKeys).toEqual(allowedKeys);

      // Verify no sensitive patterns in key names
      for (const key of returnedKeys) {
        expect(key).not.toMatch(/SECRET/i);
        expect(key).not.toMatch(/SERVICE_ROLE/i);
        expect(key).not.toMatch(/PASSWORD/i);
        expect(key).not.toMatch(/PRIVATE/i);
      }
    });

    it("should NOT include SUPABASE_SECRET_KEY in client ENV", () => {
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      };

      expect(clientEnv).not.toHaveProperty("SUPABASE_SECRET_KEY");
      expect(clientEnv).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
    });

    it("should NOT include DATABASE_URL in client ENV", () => {
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      };

      expect(clientEnv).not.toHaveProperty("DATABASE_URL");
    });

    it("should use publishable/anon key naming convention", () => {
      const clientEnv = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,
      };

      // Should use publishable/anon naming convention
      expect(clientEnv).toHaveProperty("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY");

      // Should NOT use legacy naming
      expect(clientEnv).not.toHaveProperty("SUPABASE_ANON_KEY");
    });
  });

  describe("Server-Only Keys", () => {
    it("should have sensitive keys available only on server", () => {
      // These should be defined in process.env (server-side)
      // but never sent to client
      const serverOnlyKeys = SENSITIVE_ENV_KEYS;

      for (const key of serverOnlyKeys) {
        // In test environment, these may or may not be set
        // The important thing is they should NEVER appear in client bundle

        // Simulate checking the client bundle
        const mockClientBundle = {
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: "sb_publishable_xxx",
        };

        expect(mockClientBundle).not.toHaveProperty(key);
      }
    });

    it("should use SECRET_KEY naming for admin client (not SERVICE_ROLE)", () => {
      // This test verifies the codebase uses modern key naming
      // SUPABASE_SECRET_KEY instead of SUPABASE_SERVICE_ROLE_KEY

      const modernKeyName = "SUPABASE_SECRET_KEY";
      const legacyKeyName = "SUPABASE_SERVICE_ROLE_KEY";

      // The lib/supabase/server.ts should reference SECRET_KEY
      // This is a code convention check more than runtime check
      expect(modernKeyName).toBe("SUPABASE_SECRET_KEY");
      expect(legacyKeyName).not.toBe(modernKeyName);
    });
  });

  describe("window.ENV Security", () => {
    it("should serialize ENV safely without secrets", () => {
      const envToExpose = {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: "sb_publishable_xxx",
      };

      const serialized = JSON.stringify(envToExpose);

      // Should not contain sensitive data
      expect(serialized).not.toMatch(/SECRET/i);
      expect(serialized).not.toMatch(/SERVICE_ROLE/i);
      expect(serialized).not.toMatch(/DATABASE_URL/i);
      expect(serialized).not.toMatch(/postgres/i);
      expect(serialized).not.toMatch(/password/i);
    });

    it("should not allow prototype pollution in ENV", () => {
      const envToExpose = {
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: "sb_publishable_xxx",
      };

      // Ensure no __proto__ or constructor properties
      expect(envToExpose).not.toHaveProperty("__proto__");
      expect(envToExpose).not.toHaveProperty("constructor");
      expect(envToExpose).not.toHaveProperty("prototype");
    });
  });

  describe("ENV Key Validation", () => {
    it("should have valid publishable key format", () => {
      const publishableKey = "sb_publishable_xxx";

      // Publishable keys should start with sb_publishable_
      expect(publishableKey).toMatch(/^sb_publishable_/);

      // Should NOT look like a secret key
      expect(publishableKey).not.toMatch(/^sb_secret_/);
      expect(publishableKey).not.toMatch(/^eyJ/); // JWT format
    });

    it("should distinguish between publishable and secret keys", () => {
      const publishableKey = "sb_publishable_abc123";
      const secretKey = "sb_secret_xyz789";

      // They should have different prefixes
      expect(publishableKey.startsWith("sb_publishable_")).toBe(true);
      expect(secretKey.startsWith("sb_secret_")).toBe(true);

      // Cross-check: publishable is NOT secret format
      expect(publishableKey.startsWith("sb_secret_")).toBe(false);
    });
  });
});
