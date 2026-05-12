# Module: Expenses — Chi phí (`/expenses`)

> Walk-through 2026-05-12.
> Source UI: `apps/admin/app/(dashboard)/expenses/_content.tsx` (~12KB)
> Existing TC: TC-EXP-001..005 (many duplicated/needs-fix), cross TC-ACC-* (accounting).

## Screen Inventory

| Screen | Notes |
|--------|-------|
| List `/expenses` | Search. Date range filter. Category filter. Columns: date, category, description, amount, createdBy. Create/Edit inline form or drawer (verify). |

---

## (I) Interaction Test Cases

### US-EXP-I001 — Date range filter

**Acceptance Criteria**:
- AC1 (Default range**): Current month or last 30 days?
- AC2 (Quick presets**): Hôm nay / Tuần này / Tháng này / Tuỳ chỉnh.
- AC3 (Custom range**): Date picker for start/end.
- AC4 (Page reset on date change**).

### US-EXP-I002 — Category filter

**Acceptance Criteria**: Select from predefined expense categories (utilities, marketing, shipping, etc.). Verify list.

### US-EXP-I003 — Create expense flow

**Acceptance Criteria**:
- AC1 (Required**): date, category, amount.
- AC2 (Amount NumberInput**): Min 1, no negative.
- AC3 (Note optional**).
- AC4 (Receipt image upload**): Verify if exists.

### US-EXP-I004 — Edit/delete expense

**Acceptance Criteria** (TC-EXP-004, TC-EXP-005 missing):
- AC1 (Edit pre-fill**).
- AC2 (Delete confirm dialog**).
- AC3 (Soft vs hard delete**).

### US-EXP-I005 — Total summary card

**Acceptance Criteria**: Total expense trong filter range hiển thị KPI card.

---

## (B) Business Test Cases

### US-EXP-B001 — Validation (TC-ACC-013, TC-EXP-003)

**Acceptance Criteria**:
- AC1 (Required date/category/amount**).
- AC2 (Amount > 0**): Server reject ≤ 0.
- AC3 (Future date allowed?**): Verify business rule.

### US-EXP-B002 — Expense P&L impact (TC-ACC-001)

**Acceptance Criteria**:
- AC1 (Profit calc**): P&L = revenue - COGS - expenses (in date range).
- AC2 (Excluded categories**): Some categories (e.g., owner draw) excluded? Verify.

### US-EXP-B003 — Edit/delete audit (TC-EXP-004, 005)

**Acceptance Criteria**:
- AC1 (Edit allowed any time**): Or limited window?
- AC2 (Delete impacts past P&L**): Historical reports change after delete. Consider locking after period close.
- AC3 (Audit log**).

### US-EXP-B004 — Aggregate by category report

**Acceptance Criteria**:
- AC1 (Category total**): SUM(amount) per category.
- AC2 (Date range**).
- AC3 (Export?**): Verify TC-ACC-006 Excel export.

### US-EXP-B005 — RBAC

Manager/Owner. Staff likely read-only.

---

## Linked TC-IDs

TC-EXP-001..005, TC-ACC-001..014 — heavy overlap with accounting module.

## Notes

- Recurring expenses (rent, utilities)? Not observed.
- Multi-currency? Not observed.
- Receipt image storage? Verify.
- Expense vs payout (supplier payment) distinction documented? Cross-ref payouts module.
