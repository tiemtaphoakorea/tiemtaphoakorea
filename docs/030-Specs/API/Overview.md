---
id: SPEC-002
type: spec
status: draft
project: Auth Shop Platform
created: 2026-01-21
---

# API Overview

## 1. Introduction

The Auth Shop Platform uses **Next.js** for its backend logic. Therefore, the "API" primarily consists of:

1.  **Server Components (GET)**: Server-side data fetching.
2.  **Route Handlers (GET/POST/PUT/DELETE)**: HTTP endpoints under `app/api/*`.
3.  **Server Actions**: Next.js `use server` functions for internal mutations (invoked by form `action` or `useActionState`). They run on the server and do **not** expose a public URL.

## 2. Authentication

All protected routes must verify the session using Supabase Auth.

- **Header**: `Cookie: sb-access-token=...` (Managed by Supabase Helpers)
- **RLS**: Database queries are executed with the user's JWT context to enforce Row Level Security.

## 3. Response Format

### JSON APIs (Resource Routes)

Standard JSON response envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Handling

| Status Code | Description                                 |
| :---------- | :------------------------------------------ |
| `200`       | Success                                     |
| `400`       | Bad Request (Validation Error)              |
| `401`       | Unauthorized (Not logged in)                |
| `403`       | Forbidden (Logged in but insufficient role) |
| `404`       | Not Found                                   |
| `500`       | Internal Server Error                       |

## 4. Common Data Types

### Pagination

```ts
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

### Date Format

All dates are returned as ISO 8601 strings, UTC.

- Example: `"2026-01-21T10:00:00Z"`
