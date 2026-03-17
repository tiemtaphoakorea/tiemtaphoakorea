---
id: QA-STRATEGY
type: plan
status: draft
project: Auth Shop Platform
created: 2026-01-21
---

# Test Strategy

## 1. Overview

This document outlines the testing approach for the Auth Shop Platform to ensure stability, security, and functional correctness.

## 2. Testing Levels

### 2.1 Unit Testing

- **Scope**: Utility functions, individual components, Next.js Server Components/Server Actions logic (isolated).
- **Tools**: `Vitest`, `React Testing Library`.
- **Target Coverage**: > 70% for Core Modules (Auth, Finance, Inventory).
- **Location**: `tests/unit/`

### 2.2 Integration Testing

- **Scope**: Interaction between API routes and Database (Supabase).
- **Tools**: `Vitest` (with a test DB environment).
- **Key Flows**:
  - User Login & Session Creation.
  - Creating an Order -> Checking Stock deduction.
- **Location**: `tests/integration/`

### 2.3 End-to-End (E2E) Testing

- **Scope**: Critical user journeys from the browser perspective.
- **Tools**: `Playwright`.
- **Critical Paths**:
  - Admin login flow.
  - Storefront catalog browsing and product detail viewing.
  - Admin "Create Order" flow (contact-based ordering).
- **Location**: `tests/e2e/`

## 3. Test Data Management

- **Seed Data**: Use `prisma db seed` or a custom Supabase seed script to populate:
  - Default Roles.
  - Sample Categories & Products.
  - Test Users (Admin, Staff).

## 4. Manual Testing (QA)

For the MVP, specific complex logic requires manual verification:

- **Finance**: Verify P&L calculations manually against a spreadsheet for the first 50 orders.
- **Realtime**: Verify Chat latency and notification delivery across two devices.
