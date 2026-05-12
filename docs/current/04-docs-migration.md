# Docs Migration

This folder is the new active docs structure. The old docs stay in place until they are reviewed and either migrated or deleted.

## Active Docs

- `docs/current/**`

Agents should read these first.

## Legacy Docs

These folders are historical until migrated:

- `docs/010-Planning`
- `docs/020-Requirements`
- `docs/022-User-Stories`
- `docs/030-Specs`
- `docs/035-QA`
- `docs/040-Design`
- `docs/050-Research`
- `docs/060-Manuals`
- `docs/999-Resources`
- `docs/superpowers`
- `plans`

Generated or tool-owned docs:

- `docs/guide/out`
- `docs/guide/node_modules`
- `docs/.obsidian`

Do not edit generated folders by hand.

`docs/guide/` itself is not legacy. It is the user-facing documentation site and should be updated in parallel when durable behavior in `docs/current/` changes.

## Migration Process

For each legacy area:

1. Identify current facts and business rules that are still true.
2. Move durable behavior into `06-business-rules.md` or the relevant module doc.
3. Keep route/page lists short; link them to the service that owns the behavior.
4. Delete or archive stale docs only after the new doc covers the useful content.
5. Update links from `README.md`, `docs/000-Index.md`, and `docs/CLAUDE.md`.
6. Run link/discovery checks where practical.

If a legacy doc, test, or code path appears obsolete but the current docs do not say so, ask for confirmation before deleting it.

Use `08-legacy-doc-review.md` for the current deletion queue, migration blockers, and guide sync gaps.

## Deletion Candidates

The following should be reviewed early:

- `docs/admin-test-cases.md` - overlaps heavily with QA test case files.
- `docs/035-QA/Test-Cases/TC-SEC-*.md` - security coverage is deferred.
- `docs/.DS_Store`, `plans/.DS_Store`, nested `.obsidian` folders under plan exports.

Delete these only after confirming no current doc links to them.

## Retired Docs

- `docs/035-QA/Traceability-E2E.md` - stale generated paths and deleted security suites.
- `docs/035-QA/TEST-STATUS.md` - stale status against current tests.
- `docs/superpowers/plans/2026-04-15-security-fixes.md` - historical security plan for removed tests.
- `docs/superpowers/plans/2026-04-16-security-test-round2.md` - historical security test cleanup plan for removed tests.
