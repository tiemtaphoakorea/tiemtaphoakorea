---
id: MTP-Phase1
type: test-plan
status: draft
project: Auth Shop Platform
created: 2026-01-21
---

# Master Test Plan - Phase 1 MVP

## 1. Introduction

This document outlines the test strategy for the Phase 1 MVP of the Auth Shop Platform. The goal is to ensure core functionality works reliably for Owners, Managers, Staff, and Customers.

## 2. Scope

### In-Scope

- **Modules**: Auth, Product, Customer Page, Customer Mgmt, Order, Payment, Chat, Accounting, Dashboard.
- **Types**: Functional, Role-Based Access Control (RBAC), Smoke Testing.
- **Browsers**: Chrome (Latest), Safari (Latest) on Desktop/Mobile.

### Out-of-Scope

- Specialized Performance Testing (Load > 1000 users).
- Native Mobile Apps (Web only).

## 3. Test Strategy

We will use a mix of Manual Exploratory Testing and Automated E2E verification (later phase).

### Roles & Access

| Role         | Scope                               |
| ------------ | ----------------------------------- |
| **Owner**    | Full System Access                  |
| **Manager**  | All excluding P&L/Sensitive Finance |
| **Staff**    | Order & Product Mgmt (Restricted)   |
| **Customer** | Catalog View Only                   |

## 4. Test Deliverables

- Test Cases (TC-\*)
- Bug Reports
- Final QA Summary Report

## 5. Entry/Exit Criteria

- **Entry**: Code frozen, Database migrations applied.
- **Exit**: All P0/P1 Critical bugs resolved.

## 6. Test Case Summary

| ID          | Feature               | Priority |
| ----------- | --------------------- | -------- |
| TC-AUTH-001 | Admin Login & Role    | P0       |
| TC-PROD-001 | Product CRUD          | P0       |
| TC-ORD-001  | Order Processing      | P0       |
| TC-CUST-001 | Customer Profile CRUD | P1       |
| TC-CHAT-001 | Admin-Customer Chat   | P1       |
| TC-ACC-001  | Expense & P&L         | P1       |
| TC-PAY-001  | Partial Payment       | P1       |
| TC-DASH-001 | Dashboard Metrics     | P2       |
