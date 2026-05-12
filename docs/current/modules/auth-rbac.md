# Auth And RBAC

## Current Roles

- `owner`: full admin access.
- `manager`: operations and analytics access, no owner-only user/settings paths.
- `staff`: operational access for day-to-day workflows.
- `customer`: public/storefront identity, not an internal admin role.

## Key Code

| Area | Path |
| --- | --- |
| Admin login route | `apps/admin/app/api/admin/login/route.ts` |
| Admin logout route | `apps/admin/app/api/admin/logout/route.ts` |
| Admin profile route | `apps/admin/app/api/admin/profile/route.ts` |
| API auth helper | `apps/admin/lib/api-auth.ts` |
| Database auth helper | `packages/database/src/lib/auth.ts` |
| Session/password helper | `packages/database/src/lib/security.ts` |
| User service | `packages/database/src/services/user.server.ts` |
| Profile schema | `packages/database/src/schema/profiles.ts` |

## Expected API Statuses

- `401`: no valid internal user/session.
- `403`: authenticated internal user exists, but role is insufficient.

Use this distinction in tests.

## Business Rules

- Only `owner`, `manager`, and `staff` are internal admin roles.
- `customer` is a storefront/customer role and must not be treated as internal admin access.
- Customer records do not create admin access.
- Owner-only paths should assert insufficient-role behavior with `403`, not `401`.
- Owner-only domains currently include user management and detailed finance/reporting API routes.
- Internal operational API routes commonly accept all internal roles.
- User lists exclude customer profiles.
- The system must keep at least one owner; last-owner demotion, deactivation, or deletion is rejected by user service code.
- User role/status changes invalidate the profile auth cache.
- See `docs/current/06-business-rules.md` for the cross-domain RBAC rules.

## Notes

- Customer records do not imply admin access.
- Manager/staff page visibility should be verified against the current route matrix before adding strict tests, because current route handlers often distinguish only `internal` vs `owner`.
- Security-specific test suites are deferred until a real threat model and route matrix are defined.
- Do not restore broad security suites that use fake endpoints or tautological assertions.
