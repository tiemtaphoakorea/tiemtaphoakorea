# Documentation

Use `docs/current/` as the active documentation set.

## Start Here

- `current/README.md` - active docs index.
- `current/00-agent-map.md` - routing map for agents.
- `current/01-system-overview.md` - repo and domain overview.
- `current/02-development-workflow.md` - commands and DB workflow.
- `current/03-testing.md` - test policy and cleanup rules.
- `current/04-docs-migration.md` - migration plan from legacy docs.

## Legacy Docs

The remaining numbered folders are historical context while content is migrated into `docs/current/`. Some placeholder maps, stale QA snapshots, and deferred security QA cases have already been retired; check `current/08-legacy-doc-review.md` before deleting another batch.

The stale QA snapshots `035-QA/TEST-STATUS.md` and `035-QA/Traceability-E2E.md` have been retired because they referenced removed tests and outdated coverage status.

## User Guide Docs

`docs/guide/` is the user-facing documentation site. Keep it in sync with `docs/current/`, but do not treat it as disposable legacy docs. Generated guide output under `docs/guide/out` and dependencies under `docs/guide/node_modules` should not be edited by hand.
