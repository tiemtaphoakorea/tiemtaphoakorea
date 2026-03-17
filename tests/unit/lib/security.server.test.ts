import { describe, expect, it } from "vitest";
import { hashPassword, signSession, verifyPassword, verifySession } from "@/lib/security.server";

describe("security.server", () => {
  describe("password hashing", () => {
    it("should hash password and verify it", async () => {
      const password = "my-secret-password";
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      expect(await verifyPassword(password, hash)).toBe(true);
    });

    it("should fail verification for wrong password", async () => {
      const password = "password";
      const hash = await hashPassword(password);

      expect(await verifyPassword("wrong-password", hash)).toBe(false);
    });
  });

  describe("session signing", () => {
    it("should sign and verify session", async () => {
      const payload = { userId: "user-1", role: "admin" };
      const token = await signSession(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const verified = await verifySession(token);
      expect(verified).toMatchObject(payload);
    });

    it("should return null for invalid token", async () => {
      const invalidToken = "invalid.token.here";
      const result = await verifySession(invalidToken);
      expect(result).toBeNull();
    });
  });
});
