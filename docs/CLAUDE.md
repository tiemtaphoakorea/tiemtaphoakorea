# Docs Navigation for Agents

## How this vault is organized

```
docs/
├── 000-Index.md          ← Human-facing top-level index
├── 010-Planning/         ← OKRs, roadmap, sprints
├── 020-Requirements/     ← PRD, requirements
├── 022-User-Stories/     ← Epics and backlog items
├── 030-Specs/            ← Technical specs per feature
├── 035-QA/               ← Test plans, test cases, reports
├── 040-Design/           ← UI system, screen designs
└── 999-Resources/        ← Glossary
```

## Go directly to what you need

| Goal | File to read |
|------|-------------|
| Find all test cases and their status | `docs/035-QA/TEST-STATUS.md` |
| Find test cases for a specific domain | `docs/035-QA/QA-MOC.md` (grouped by domain) |
| Read a specific test case | `docs/035-QA/Test-Cases/TC-<ID>.md` |
| Find the spec for a feature | `docs/030-Specs/Spec-<Feature>.md` |
| See recent QA review findings | `docs/035-QA/Reports/QA-Review-2026-04-09.md` |
| Understand the overall system | `docs/030-Specs/Architecture/SDD-AuthShopPlatform.md` |
| Find API endpoints | `docs/030-Specs/API/Endpoints.md` |
| RBAC / permission matrix | `docs/030-Specs/Spec-RBAC-Matrix.md` |

## Test case status values

| Status | Meaning |
|--------|---------|
| `active` | Test exists and passes |
| `needs-fix` | Test exists but has issues (false positive, wrong assertion, dead code) |
| `missing` | Test case defined but no spec file exists yet |
| `reviewed` | Test reviewed, no issues found |
| `draft` | Test case document drafted, spec may not exist |

## Spec files by domain

| Domain | Spec file |
|--------|-----------|
| Auth / RBAC | `030-Specs/Spec-Authentication-Authorization.md` |
| Products | `030-Specs/Spec-Product-Management.md` |
| Orders | `030-Specs/Spec-Order-Management.md` |
| Customers | `030-Specs/Spec-Customer-CRM.md` |
| Storefront / Catalog | `030-Specs/Spec-Customer-Catalog.md` |
| Suppliers | `030-Specs/Spec-Supplier-Management.md` |
| Finance / Accounting | `030-Specs/Spec-Finance-Accounting.md` |
| Dashboard / Reports | `030-Specs/Spec-Dashboard-Reports.md` |
| Chat | `030-Specs/Spec-Chat-System.md` |
| Infrastructure | `030-Specs/Spec-Infrastructure.md` |
