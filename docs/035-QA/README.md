# QA Docs

This folder is legacy until the QA docs are rebuilt.

For active test guidance, read:

- `../current/03-testing.md`
- `../current/05-test-cleanup-backlog.md`

## Current State

- Unit, integration, component, and E2E tests live under `tests/`.
- E2E execution resets and seeds the database through `tests/e2e/global-setup.ts`.
- Security test suites are deferred and should not be counted as current coverage.
- `TEST-STATUS.md` and `Traceability-E2E.md` were retired because they referenced removed tests and outdated coverage status.
- Many `Test-Cases/TC-*.md` files are still stale snapshots.

## Migration Plan

1. Keep this README as the QA entrypoint.
2. Migrate only still-valid QA facts into `docs/current/03-testing.md` and `docs/current/05-test-cleanup-backlog.md`.
3. Archive or delete stale `TC-SEC-*` docs after the security coverage plan is rewritten.
4. Regenerate traceability only after the active E2E suite is cleaned.
