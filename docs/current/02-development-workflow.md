# Development Workflow

## Install

```bash
pnpm install
```

## Run Locally

Run both apps:

```bash
pnpm dev
```

Run one app:

```bash
pnpm --filter @workspace/main dev
pnpm --filter @workspace/admin dev
```

Expected local URLs:

- Storefront: `http://localhost:3000`
- Admin: `http://localhost:3001`

## Database

Migrations live in `packages/database/drizzle`.

Common commands:

```bash
pnpm --filter @workspace/database db:generate
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:migrate
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:status
DATABASE_URL=<target-db-url> pnpm --filter @workspace/database db:mark-baseline
```

Builds run DB status checks. If a schema change is made, generate and commit the migration SQL and meta files.

## Verification

Prefer the narrowest command that proves the change:

```bash
pnpm test
pnpm exec vitest run tests/unit/path/to/file.test.ts
pnpm exec playwright test --list
```

Do not run E2E tests casually. `tests/e2e/global-setup.ts` resets and seeds the database.

When running E2E against the local admin app, the default admin target is `http://localhost:3001`. Set `ADMIN_BASE_URL` only when intentionally targeting a different admin URL:

```bash
ADMIN_BASE_URL=http://localhost:3001 pnpm exec playwright test <path> --project=chromium
```

Only run that after confirming the DB reset is acceptable.
