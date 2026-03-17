# Engineering Standards & Guidelines

This document outlines the technical standards and best practices for the **Auth Shop Platform**.

## 1. Code Quality Tools

| Tool           | Purpose                   | Command                          |
| :------------- | :------------------------ | :------------------------------- |
| **Biome**      | Linting & Formatting      | `npm run lint`, `npm run format` |
| **TypeScript** | Static Type Checking      | `npm run typecheck`              |
| **Madge**      | Circular Dependency Check | `npm run check:cycles`           |
| **Vitest**     | Unit Testing              | `npm run test:unit`              |
| **Playwright** | E2E Testing               | `npm run test:e2e`               |

## 2. Architectural Guidelines

### 2.1 Circular Dependencies

**Rule**: Circular dependencies are strictly forbidden in the codebase.

**Reasoning**:

- They make the code hard to reason about.
- They cause runtime issues (modules are undefined during simple imports).
- They prevent tree-shaking and efficient bundling.

**Prevention**:

- **Schema**: Use `app/db/schema/relations.ts` to define Drizzle relations. Do NOT define relations in the same file as the Table definition if it causes a cycle.
- **Services**: Ensure a strict hierarchy. `Service A` -> `Service B`. If `Service B` needs `Service A`, extract the shared logic to `Service C` or a utility.

### 2.2 Database Schema

- Define tables in `app/db/schema/[domain].ts`.
- Export all tables in `app/db/schema/index.ts`.
- Keep table definitions pure (no logic).
