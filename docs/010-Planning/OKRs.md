---
id: PLAN-OKRs
type: okrs
status: active
project: Auth Shop Platform
created: 2026-01-19
updated: 2026-01-30
linked-to: [[PRD-AuthShopPlatform]], [[Roadmap]]
---

# OKRs: Auth Shop Platform (MVP Phase 1)

## Overview

Objectives and Key Results for the MVP phase of Auth Shop Platform, aligned with the PRD goals and 4-week timeline.

---

## Objective 1: Operational Efficiency

**Goal**: Streamline shop operations through automated inventory and order management.

### Key Results

| KR   | Description                                      | Target   | Status      |
| ---- | ------------------------------------------------ | -------- | ----------- |
| 1.1  | Complete product management with variants        | 100%     | In Progress |
| 1.2  | Implement order lifecycle (pending → delivered)  | 100%     | In Progress |
| 1.3  | Auto-generate order numbers and customer codes   | 100%     | In Progress |
| 1.4  | Stock auto-update on order creation/cancellation | 100%     | In Progress |

---

## Objective 2: Access Control & Security

**Goal**: Implement robust role-based access control for different staff levels.

### Key Results

| KR   | Description                                  | Target   | Status      |
| ---- | -------------------------------------------- | -------- | ----------- |
| 2.1  | Admin authentication via Supabase Auth       | 100%     | In Progress |
| 2.2  | RBAC for Owner/Manager/Staff roles           | 100%     | In Progress |
| 2.3  | Row Level Security (RLS) on all tables       | 100%     | In Progress |
| 2.4  | Password reset restricted to Owner           | 100%     | In Progress |

---

## Objective 3: Business Transparency

**Goal**: Provide real-time business insights for decision making.

### Key Results

| KR   | Description                                  | Target   | Status      |
| ---- | -------------------------------------------- | -------- | ----------- |
| 3.1  | Dashboard with revenue/profit charts         | 100%     | Not Started |
| 3.2  | P&L report (Revenue - Expenses)              | 100%     | Not Started |
| 3.3  | Cost price tracking per variant              | 100%     | In Progress |
| 3.4  | Expense management (Fixed/Variable)          | 100%     | Not Started |

---

## Objective 4: Customer Experience

**Goal**: Enable seamless customer interaction and communication.

### Key Results

| KR   | Description                                  | Target   | Status      |
| ---- | -------------------------------------------- | -------- | ----------- |
| 4.1  | Read-only product catalog for customers      | 100%     | In Progress |
| 4.2  | Real-time chat between Admin and Customer    | 100%     | Not Started |
| 4.3  | Customer purchase history view               | 100%     | In Progress |

---

## Timeline Alignment

| Week | Focus                           | Related OKRs       |
| ---- | ------------------------------- | ------------------ |
| 1    | Foundation & Core Data          | O2 (2.1, 2.2, 2.3) |
| 2    | Inventory & Customers           | O1 (1.1), O4 (4.1) |
| 3    | Order Operations                | O1 (1.2, 1.3, 1.4) |
| 4    | Real-time, Accounting & Reports | O3, O4 (4.2)       |

---

## Success Criteria (MVP)

- [ ] All 10 modules from PRD implemented
- [ ] 100% test coverage on critical paths (Auth, Orders, Payments)
- [ ] Zero critical security vulnerabilities
- [ ] Deploy to production on Vercel

---

## Related Documents

- [[Roadmap]] - Detailed timeline
- [[PRD-AuthShopPlatform]] - Full requirements
