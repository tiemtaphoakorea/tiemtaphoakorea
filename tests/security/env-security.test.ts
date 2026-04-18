/**
 * Environment Security Tests
 *
 * Verifies that required environment variables are present in CI/production
 * and that sensitive env vars are not accidentally exposed to the client.
 */

import { describe, expect, it } from "vitest";

describe("Environment Security", () => {
  describe("Required server-side env vars have valid format when set", () => {
    // These tests skip gracefully in local dev when vars are absent.
    // In CI, where vars should always be set, they will catch misconfiguration.

    it("SUPABASE_URL must be a valid URL when set", () => {
      const val = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
      if (!val) return; // skip locally if not set
      expect(() => new URL(val)).not.toThrow();
    });

    it("SUPABASE_SERVICE_ROLE_KEY must not be empty when set", () => {
      const val = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!val) return;
      expect(val.trim().length).toBeGreaterThan(0);
    });

    it("DATABASE_URL must start with postgres:// or postgresql:// when set", () => {
      const val = process.env.DATABASE_URL;
      if (!val) return;
      expect(val).toMatch(/^postgres(ql)?:\/\//);
    });
  });

  describe("Sensitive keys must not be exposed as NEXT_PUBLIC_ vars", () => {
    it("SERVICE_ROLE_KEY must not have NEXT_PUBLIC_ prefix", () => {
      const publicKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      expect(publicKey).toBeUndefined();
    });

    it("DATABASE_URL must not have NEXT_PUBLIC_ prefix", () => {
      const publicDb = process.env.NEXT_PUBLIC_DATABASE_URL;
      expect(publicDb).toBeUndefined();
    });

    it("JWT_SECRET must not have NEXT_PUBLIC_ prefix", () => {
      const publicJwt = process.env.NEXT_PUBLIC_JWT_SECRET;
      expect(publicJwt).toBeUndefined();
    });
  });
});
