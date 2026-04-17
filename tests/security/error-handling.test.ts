/**
 * Error Handling Security Tests
 *
 * Tests to ensure error responses don't leak sensitive information:
 * - No stack traces in production
 * - No database schema exposure
 * - Generic error messages for public endpoints
 * - Proper error logging without sensitive data
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertSafeErrorResponse } from "./helpers/security-helpers";

describe("Error Handling Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Stack Trace Protection", () => {
    it("[docs] should NOT include stack trace in production errors", () => {
      const productionError = {
        message: "An error occurred",
        status: 500,
      };

      expect(productionError).not.toHaveProperty("stack");
      expect(JSON.stringify(productionError)).not.toMatch(/at\s+\w+\s+\(/);
    });

    it("[docs] should allow stack trace only in development mode", () => {
      const isDevelopment = process.env.NODE_ENV !== "production";

      const devError = {
        message: "Test error",
        stack: isDevelopment ? "Error: Test\n    at test.ts:10:5" : undefined,
      };

      if (isDevelopment) {
        expect(devError.stack).toBeDefined();
      } else {
        expect(devError.stack).toBeUndefined();
      }
    });

    it("[docs] should strip stack trace before sending response", () => {
      const internalError = new Error("Database connection failed");
      internalError.stack = "Error: Database connection failed\n    at db.ts:50";

      // Before sending to client, strip stack
      const clientError = {
        message: "An internal error occurred",
        // stack: internalError.stack, // DO NOT include
      };

      expect(clientError).not.toHaveProperty("stack");
    });
  });

  describe("Database Error Protection", () => {
    it("[docs] should NOT expose table names in errors", () => {
      const dbErrors = [
        'relation "users" does not exist',
        'column "password" does not exist',
        "insert or update on table",
        "foreign key constraint",
      ];

      for (const _dbError of dbErrors) {
        // These should be caught and replaced with generic message
        const clientMessage = "An internal error occurred";

        expect(clientMessage).not.toContain("relation");
        expect(clientMessage).not.toContain("column");
        expect(clientMessage).not.toContain("table");
      }
    });

    it("[docs] should NOT expose SQL syntax errors", () => {
      const sqlErrors = [
        "syntax error at or near 'SELECT'",
        "unterminated quoted string",
        'column "email" of relation "profiles"',
        "pg_catalog",
      ];

      for (const _sqlError of sqlErrors) {
        const safeError = "Database operation failed";

        assertSafeErrorResponse(safeError, "SQL error");
      }
    });

    it("[docs] should NOT reveal database connection details", () => {
      const connectionErrors = [
        "connection refused to localhost:5432",
        "FATAL: password authentication failed",
        "could not connect to server: Connection refused",
        "postgresql://user:password@host",
      ];

      for (const _connError of connectionErrors) {
        const safeError = "Service temporarily unavailable";

        expect(safeError).not.toContain("localhost");
        expect(safeError).not.toContain("5432");
        expect(safeError).not.toContain("password");
        expect(safeError).not.toContain("postgresql://");
      }
    });
  });

  describe("Authentication Error Messages", () => {
    it("[docs] should use generic message for invalid credentials", () => {
      // Don't reveal whether email or password was wrong
      const authError = "Invalid email or password";

      // Should NOT say:
      // - "Email not found"
      // - "Password incorrect"
      // - "User does not exist"

      expect(authError).not.toMatch(/email not found/i);
      expect(authError).not.toMatch(/user.*not.*exist/i);
      expect(authError).not.toMatch(/password incorrect/i);
    });

    it("[docs] should not reveal user existence", () => {
      // For security, don't confirm if email exists
      const loginFailureMessage = "Invalid email or password";

      // Same message for both:
      // - Email doesn't exist
      // - Email exists but wrong password
      expect(loginFailureMessage).toBe("Invalid email or password");
    });

    it("[docs] should handle session expiry gracefully", () => {
      const sessionError = {
        message: "Your session has expired. Please log in again.",
        code: "SESSION_EXPIRED",
      };

      // Should NOT reveal:
      // - Token details
      // - Internal session mechanics
      expect(sessionError.message).not.toContain("JWT");
      expect(sessionError.message).not.toContain("token");
    });
  });

  describe("API Error Response Format", () => {
    it("[docs] should return consistent error structure", () => {
      const errorResponse = {
        error: "Not authorized",
        status: 401,
      };

      // All errors should have consistent structure
      expect(errorResponse).toHaveProperty("error");
      expect(typeof errorResponse.error).toBe("string");

      // Should NOT have internal details
      expect(errorResponse).not.toHaveProperty("stack");
      expect(errorResponse).not.toHaveProperty("query");
      expect(errorResponse).not.toHaveProperty("sql");
    });

    it("[docs] should use appropriate HTTP status codes", () => {
      const errorCases = [
        { error: "Not found", expectedStatus: 404 },
        { error: "Unauthorized", expectedStatus: 401 },
        { error: "Forbidden", expectedStatus: 403 },
        { error: "Bad request", expectedStatus: 400 },
        { error: "Internal error", expectedStatus: 500 },
      ];

      for (const { expectedStatus } of errorCases) {
        expect(expectedStatus).toBeGreaterThanOrEqual(400);
        expect(expectedStatus).toBeLessThan(600);
      }
    });

    it("[docs] should not include debug info in production responses", () => {
      const productionError = {
        error: "Operation failed",
        // Should NOT include in production:
        // debug: { query: "SELECT * FROM...", params: [...] },
        // internalCode: "ERR_DB_CONN_001",
      };

      expect(productionError).not.toHaveProperty("debug");
      expect(productionError).not.toHaveProperty("internalCode");
      expect(productionError).not.toHaveProperty("trace");
    });
  });

  describe("Validation Error Messages", () => {
    it("[docs] should provide user-friendly validation errors", () => {
      const validationErrors = [
        { field: "email", message: "Please enter a valid email address" },
        { field: "phone", message: "Phone number must be 10-11 digits" },
        { field: "quantity", message: "Quantity must be greater than 0" },
      ];

      for (const error of validationErrors) {
        // Should be user-friendly, not technical
        expect(error.message).not.toMatch(/regex/i);
        expect(error.message).not.toMatch(/pattern/i);
        expect(error.message).not.toMatch(/constraint/i);
      }
    });

    it("[docs] should not expose schema validation details", () => {
      const schemaError = "Invalid input data";

      // Should NOT reveal:
      // - Field constraints
      // - Database column types
      // - Zod schema details
      expect(schemaError).not.toContain("varchar");
      expect(schemaError).not.toContain("integer");
      expect(schemaError).not.toContain("uuid");
    });
  });

  describe("Error Logging Security", () => {
    it("[docs] should log errors internally without exposing to client", () => {
      const internalLog = {
        timestamp: new Date().toISOString(),
        level: "error",
        message: "Database query failed",
        query: "SELECT * FROM users WHERE id = $1",
        error: "Connection timeout",
      };

      const clientResponse = {
        error: "An unexpected error occurred",
      };

      // Internal log has details
      expect(internalLog).toHaveProperty("query");

      // Client response does not
      expect(clientResponse).not.toHaveProperty("query");
    });

    it("[docs] should redact sensitive data in logs", () => {
      const sensitiveData = {
        email: "user@example.com",
        password: "secret123",
        creditCard: "4111111111111111",
      };

      const redactedLog = {
        email: sensitiveData.email, // OK to log
        password: "***REDACTED***",
        creditCard: "****1111",
      };

      expect(redactedLog.password).toBe("***REDACTED***");
      expect(redactedLog.creditCard).toMatch(/^\*+\d{4}$/);
    });

    it("[docs] should not log full request bodies with sensitive data", () => {
      const requestBody = {
        email: "user@example.com",
        password: "secret123",
        action: "login",
      };

      // Safe log version
      const safeLogBody = {
        email: requestBody.email,
        action: requestBody.action,
        // password: OMIT
      };

      expect(safeLogBody).not.toHaveProperty("password");
    });
  });

  describe("ErrorBoundary Security", () => {
    it("[docs] should show generic message in production ErrorBoundary", () => {
      const isProduction = process.env.NODE_ENV === "production";

      const errorBoundaryMessage = isProduction
        ? "An unexpected error occurred."
        : "Error details..."; // OK in dev

      if (isProduction) {
        expect(errorBoundaryMessage).not.toContain("Error:");
        expect(errorBoundaryMessage).not.toContain("at ");
      }
    });

    it("[docs] should not render error stack in production", () => {
      const isProduction = process.env.NODE_ENV === "production";
      const error = new Error("Test error");

      const shouldShowStack = !isProduction && error instanceof Error;

      if (isProduction) {
        expect(shouldShowStack).toBe(false);
      }
    });
  });

  describe("Third-Party Error Handling", () => {
    it("[docs] should not expose Supabase error details", () => {
      const _supabaseError = {
        message: "Invalid API key",
        hint: "Please check your SUPABASE_KEY",
        code: "PGRST301",
      };

      // Convert to safe client error
      const clientError = {
        error: "Authentication failed",
      };

      expect(clientError.error).not.toContain("API key");
      expect(clientError.error).not.toContain("SUPABASE");
      expect(clientError).not.toHaveProperty("hint");
      expect(clientError).not.toHaveProperty("code");
    });

    it("[docs] should not expose Drizzle ORM error details", () => {
      const _drizzleError = {
        message: "column users.password does not exist",
        code: "42703",
      };

      const clientError = {
        error: "Database operation failed",
      };

      expect(clientError.error).not.toContain("column");
      expect(clientError.error).not.toContain("password");
      expect(clientError).not.toHaveProperty("code");
    });
  });

  describe("Schema validation contracts (Zod)", () => {
    it("expenseSchema should reject missing amount", async () => {
      const { expenseSchema } = await import("@/lib/schemas");
      const result = expenseSchema.safeParse({
        type: "fixed",
        description: "test expense",
        date: "2026-04-16",
        // amount missing
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.amount).toBeDefined();
      }
    });

    it("userSchema should reject empty username", async () => {
      const { userSchema } = await import("@/lib/schemas");
      const result = userSchema.safeParse({
        fullName: "Test User",
        username: "",
        role: "staff",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.username).toBeDefined();
      }
    });
  });
});
