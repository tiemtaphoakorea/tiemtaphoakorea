# Testing

## Test Types

| Type | Path | Runner | Notes |
| --- | --- | --- | --- |
| Unit | `tests/unit` | Vitest | Fast, preferred for service and helper logic |
| Integration | `tests/integration` | Vitest | Cross-service flows, no browser |
| Component | `tests/components` | Vitest jsdom | Shared UI and selected component behavior |
| E2E | `tests/e2e` | Playwright | Browser flows, resets and seeds DB through global setup |

## Current Policy

- A test must fail when the behavior is broken.
- Avoid assertions like `expect(a || b).toBe(true)` unless both branches are explicitly meaningful and validated.
- Avoid tests whose main assertions are inside optional UI guards. If the UI control is required, assert it is visible.
- Avoid accepting both success and failure statuses for the same behavior.
- Do not keep tests only because they increase the count.
- Security tests are intentionally deferred until they can be covered with realistic routes, fixtures, and threat models.

## E2E Safety

`tests/e2e/global-setup.ts` runs:

```bash
pnpm run db:reset
pnpm run db:seed:e2e
```

So E2E execution can destroy local data. Use `pnpm exec playwright test --list` for discovery checks. Ask before running real E2E.

## Cleanup Rules

Delete tests when:

- The tested feature no longer exists.
- The test is entirely conditional and can pass without checking behavior.
- A stronger test covers the same behavior with deterministic data.
- The test documents a known gap but does not enforce anything.

Rewrite tests when:

- The feature is important and current assertions are weak.
- The expected behavior changed but is still valid.
- The test uses stale selectors but the scenario is still worth covering.

Keep tests when:

- They encode a clear business rule.
- They use isolated data and deterministic assertions.
- They fail for a real regression.

## Recent Cleanup State

- `tests/security/**` and `tests/e2e/security/**` are not part of the active test plan.
- `vitest.config.ts` should not include `tests/security`.
- Login rate limiting is not actively covered until the implementation and expected status are defined.

