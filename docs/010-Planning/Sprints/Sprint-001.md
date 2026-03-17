---
id: SPRINT-001
type: sprint
status: active
project: Auth Shop Platform
sprint-number: 1
start-date: 2026-01-20
end-date: 2026-01-24
created: 2026-01-19
updated: 2026-01-30
linked-to: [[Roadmap]], [[OKRs]]
---

# Sprint 1: Foundation & Core Data

**Duration**: Week 1 (5 Working Days)
**Focus**: Infrastructure, Auth, and Basic Product Management

---

## Sprint Goal

Establish the project foundation with authentication, database schema, and basic product CRUD operations.

---

## Sprint Backlog

### Module 1: Setup & Infrastructure (12h)

| ID      | Task                                | Estimate | Status      | Assignee |
| ------- | ----------------------------------- | -------- | ----------- | -------- |
| S1-001  | Init Next.js + Directory Structure  | 2h       | Done        | -        |
| S1-002  | Setup Supabase (DB, Auth, Storage)  | 3h       | Done        | -        |
| S1-003  | DB Schema Design & Migration        | 4h       | Done        | -        |
| S1-004  | UI Setup (Tailwind, Shadcn)         | 2h       | Done        | -        |
| S1-005  | Deploy to Vercel                    | 1h       | Done        | -        |

### Module 2: Auth & Authorization (8h)

| ID      | Task                                | Estimate | Status      | Assignee |
| ------- | ----------------------------------- | -------- | ----------- | -------- |
| S1-006  | Admin Login Page                    | 2h       | Done        | -        |
| S1-007  | Supabase Auth Integration           | 2h       | Done        | -        |
| S1-008  | RBAC Implementation (Owner/Mgr/Staff)| 2h      | Done        | -        |
| S1-009  | Protected Routes & Middleware       | 1h       | Done        | -        |
| S1-010  | Password Reset Flow                 | 1h       | Done        | -        |

### Module 3 (Start): Product Management

| ID      | Task                                | Estimate | Status      | Assignee |
| ------- | ----------------------------------- | -------- | ----------- | -------- |
| S1-011  | Category CRUD (Basic)               | 2h       | Done        | -        |
| S1-012  | Product CRUD (Basic)                | 3h       | Done        | -        |

---

## Acceptance Criteria

- [ ] Next.js app running on Vercel
- [ ] Supabase project configured with schema
- [ ] Admin can login with email/password
- [ ] RBAC restricts access based on role
- [ ] Basic Category and Product CRUD works

---

## Sprint Metrics

| Metric              | Target | Actual |
| ------------------- | ------ | ------ |
| Story Points        | 20     | -      |
| Tasks Completed     | 12     | -      |
| Hours Spent         | 20h    | -      |

---

## Blockers & Risks

| ID  | Description                          | Status   | Resolution               |
| --- | ------------------------------------ | -------- | ------------------------ |
| -   | -                                    | -        | -                        |

---

## Notes

- This sprint establishes the foundation for all subsequent development
- Focus on getting the core architecture right before adding features
- Ensure RLS policies are in place from the start

---

## Related Documents

- [[Roadmap]] - Week 1 details
- [[OKRs]] - Objective 2 (Access Control)
- [[Epic-01-Infrastructure]]
- [[Epic-02-Authentication]]
