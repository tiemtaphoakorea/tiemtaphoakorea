---
id: MOC-035
type: moc
status: review
project: Auth Shop Platform
created: 2026-01-21
updated: 2026-02-02
---

# QA MOC

Map of Content for Quality Assurance.

## Test Plans

Directory: `docs/035-QA/Test-Plans/`

- [[MTP-Phase1]] - Master Test Plan for MVP

## Test Cases

Directory: `docs/035-QA/Test-Cases/`

### Authentication

- [[TC-AUTH-001]] - Admin Login & Role Check
- [[TC-AUTH-002]] - Admin Login - Validation Errors
- [[TC-AUTH-003]] - Admin Login - Invalid Credentials
- [[TC-AUTH-004]] - Admin Login - Non-internal User Blocked
- [[TC-AUTH-005]] - Admin Logout
- [[TC-AUTH-006]] - Admin Route Protection & Session Refresh
- [[TC-AUTH-007]] - Admin Login Rate Limiting & Lockout
- [[TC-AUTH-008]] - Staff Login & Role Restrictions
- [[TC-AUTH-009]] - Manager Login & Role Restrictions
- [[TC-AUTH-010]] - Role-Based Access Restrictions by Module
- [[TC-AUTH-011]] - Owner-Only API Access
- [[TC-AUTH-012]] - Staff Access Limited to Orders, Products, Customers
- [[TC-AUTH-013]] - Manager Access to Reports vs Users
- [[TC-AUTH-014]] - Inactive User Session Revocation
- [[TC-AUTH-015]] - Direct URL Access Guard

### Product Management

- [[TC-PROD-001]] - Product Creation & Variant Management
- [[TC-PROD-002]] - Product List - Search, Filters, Pagination
- [[TC-PROD-003]] - Create Product - Validation Errors
- [[TC-PROD-004]] - Create Product - Duplicate SKU
- [[TC-PROD-005]] - Variant Matrix Generation
- [[TC-PROD-006]] - Update Product Info & Slug
- [[TC-PROD-007]] - Update Cost Price History
- [[TC-PROD-008]] - Add & Remove Variant
- [[TC-PROD-009]] - Variant Image Upload Rules
- [[TC-PROD-010]] - Inventory Stock Type Behavior
- [[TC-PROD-011]] - Low Stock Alert & Stock Filters
- [[TC-PROD-012]] - Deactivate Product & Catalog Visibility
- [[TC-PROD-013]] - Customer Catalog View
- [[TC-PROD-014]] - Category Management (Create/Edit/Assign)
- [[TC-PROD-015]] - Product Slug Uniqueness Handling
- [[TC-PROD-016]] - Variant Stock Quantity Validation
- [[TC-PROD-017]] - Category Filter Uses Active Products Only
- [[TC-PROD-018]] - Low Stock Threshold Update Affects Filter
- [[TC-PROD-019]] - Search Product by SKU in Admin
- [[TC-PROD-020]] - Concurrent Stock Update vs Order Creation
- [[TC-PROD-021]] - Concurrent Stock Updates from Two Admin Sessions
- [[TC-PROD-022]] - Prevent Negative Stock on Manual Update

### Customer Catalog

- [[TC-CATALOG-001]] - Catalog List + Search & Filter
- [[TC-CATALOG-002]] - Product Detail Variant Selection
- [[TC-CATALOG-003]] - Stock Status Labels
- [[TC-CATALOG-004]] - Public Access to Catalog and Detail
- [[TC-CATALOG-005]] - Retail Price Display Updates After Admin Change
- [[TC-CATALOG-006]] - Catalog Pagination and Empty State

### Order Management

- [[TC-ORD-001]] - Create & Process Order
- [[TC-ORD-002]] - Create Order - Validation Errors
- [[TC-ORD-003]] - Create Order with Mixed Stock Types
- [[TC-ORD-004]] - Order Status Transition Rules
- [[TC-ORD-005]] - Cancel Order Restores Stock
- [[TC-ORD-006]] - Payment Status Derivation
- [[TC-ORD-007]] - Order List - Search & Filters
- [[TC-ORD-008]] - Supplier Order Lifecycle
- [[TC-ORD-009]] - Order Edit Restrictions
- [[TC-ORD-010]] - Create Order - Insufficient Stock
- [[TC-ORD-011]] - Order Number Format and Uniqueness
- [[TC-ORD-012]] - Delete Order Rules
- [[TC-ORD-013]] - Supplier Orders Gate Preparing/Shipping
- [[TC-ORD-014]] - Supplier Order Received Updates Stock
- [[TC-ORD-015]] - Delete Supplier Order Restrictions
- [[TC-ORD-016]] - Supplier Order Update Fields Persist
- [[TC-ORD-017]] - Order Admin Note Edit Allowed
- [[TC-ORD-018]] - Order Item Quantity Edit Blocked
- [[TC-ORD-019]] - Order Status History Logged
- [[TC-ORD-020]] - Cancel Order with Pre-order Items Removes Supplier Orders
- [[TC-ORD-021]] - Manual Supplier Order Received Increases Stock
- [[TC-ORD-022]] - Cancel Paid Order Restores Stock and Keeps Payment History
- [[TC-ORD-023]] - Reject Cancel After Shipping
- [[TC-ORD-024]] - Order Payment Status Derived from Paid Amount
- [[TC-ORD-025]] - Order Total Recalculation with Multiple Items
- [[TC-ORD-026]] - Order with Zero Items Rejected

### Customer Management

- [[TC-CUST-001]] - Customer Profile CRUD
- [[TC-CUST-002]] - Create Customer - Validation Errors
- [[TC-CUST-003]] - Customer Code Auto-Increment
- [[TC-CUST-004]] - Customer List - Search & Filters
- [[TC-CUST-005]] - Customer Classification Change
- [[TC-CUST-006]] - Customer Deactivate & Reactivate
- [[TC-CUST-007]] - Customer Order History
- [[TC-CUST-008]] - Auto-Create Customer from Order
- [[TC-CUST-009]] - Customer Stats Calculation
- [[TC-CUST-010]] - Duplicate Customer Phone Handling

### Supplier Management

- [[TC-SUP-001]] - Create Supplier
- [[TC-SUP-002]] - Update Supplier Details
- [[TC-SUP-003]] - Deactivate Supplier
- [[TC-SUP-004]] - Supplier Search and Include Inactive
- [[TC-SUP-005]] - Supplier Stats and Recent Orders

### Supplier Orders

- [[TC-SUP-ORDER-001]] - Create Supplier Order
- [[TC-SUP-ORDER-002]] - Receive Stock from Supplier Order
- [[TC-SUP-ORDER-003]] - Transition Status to Ordered
- [[TC-SUP-ORDER-004]] - Transition Status to Cancelled
- [[TC-SUP-ORDER-005]] - Block Status Change from Final States
- [[TC-SUP-ORDER-006]] - Restrict Delete to Pending and Cancelled Orders
- [[TC-SUP-ORDER-007]] - Filter Orders by Status
- [[TC-SUP-ORDER-008]] - Update Stock When Receiving In-Stock Items
- [[TC-SUP-ORDER-009]] - Persist Update Fields
- [[TC-SUP-ORDER-010]] - Search Orders by SKU and Product Name
- [[TC-SUP-ORDER-011]] - Supplier Selection When Creating Order
- [[TC-SUP-ORDER-012]] - Set Expected Date When Creating Order
- [[TC-SUP-ORDER-013]] - Empty State When No Orders Exist
- [[TC-SUP-ORDER-014]] - Pagination Functionality
- [[TC-SUP-ORDER-015]] - Pre-Order Stock Type Behavior
- [[TC-SUP-ORDER-016]] - Block Unauthorized Access to API
- [[TC-SUP-ORDER-017]] - API Input Validation Errors
- [[TC-SUP-ORDER-018]] - Loading States Display
- [[TC-SUP-ORDER-019]] - Manual Restocking Orders
- [[TC-SUP-ORDER-020]] - Error Toast on Failed Operations
- [[TC-SUP-ORDER-021]] - Reject Invalid variantId
- [[TC-SUP-ORDER-022]] - Validate Quantity Constraints
- [[TC-SUP-ORDER-023]] - Sanitize Note Field Against XSS
- [[TC-SUP-ORDER-024]] - Handle Past Expected Dates
- [[TC-SUP-ORDER-025]] - Set Timestamps Only on First Transition
- [[TC-SUP-ORDER-026]] - Handle Very Large Quantities
- [[TC-SUP-ORDER-027]] - Handle Special Characters in Search
- [[TC-SUP-ORDER-028]] - Maintain Data Consistency on Rapid Status Changes

### Real-time Chat

- [[TC-CHAT-001]] - Admin-Customer Chat Flow
- [[TC-CHAT-002]] - Guest Identification & Room Creation
- [[TC-CHAT-003]] - Admin Inbox - Unread Count & Sorting
- [[TC-CHAT-004]] - Real-time Text Messaging
- [[TC-CHAT-005]] - Image Upload Validation
- [[TC-CHAT-006]] - Mark Messages as Read
- [[TC-CHAT-007]] - Message History Pagination
- [[TC-CHAT-008]] - Reuse Chat Room by Phone
- [[TC-CHAT-009]] - Message Validation
- [[TC-CHAT-010]] - Guest Cannot Access Admin Chat Routes
- [[TC-CHAT-011]] - Concurrent Send and Mark-as-Read
- [[TC-CHAT-012]] - Concurrent Messages Order Consistency

### Accounting

- [[TC-ACC-001]] - Expense Entry & P&L Calculation
- [[TC-ACC-002]] - Cost Price History Logged
- [[TC-ACC-003]] - Profit Calculation Uses Snapshot Cost
- [[TC-ACC-004]] - Report Date Range Validation
- [[TC-ACC-005]] - Top Products by Profit
- [[TC-ACC-006]] - Export Report to Excel
- [[TC-ACC-007]] - Cost Price Validation vs Selling Price
- [[TC-ACC-008]] - Daily Report Totals
- [[TC-ACC-009]] - Profit Margin Calculation
- [[TC-ACC-010]] - Expense Edit & Delete
- [[TC-ACC-011]] - Profit Report Excludes Cancelled Orders
- [[TC-ACC-012]] - Profit Report Date Range Boundaries
- [[TC-ACC-013]] - Expense Amount Validation
- [[TC-ACC-014]] - Profit Report Empty State

### Payment

- [[TC-PAY-001]] - Partial Payment Recording
- [[TC-PAY-002]] - Payment Method Validation
- [[TC-PAY-003]] - Payment Amount Validation
- [[TC-PAY-004]] - Payment Audit Trail
- [[TC-PAY-005]] - Overpayment Not Allowed
- [[TC-PAY-006]] - Multiple Payments Update Remaining Balance
- [[TC-PAY-007]] - Payment Method Required
- [[TC-PAY-008]] - Payment Negative Amount Rejected
- [[TC-PAY-009]] - Zero Payment Amount Rejected
- [[TC-PAY-010]] - Duplicate Payment Submission Prevented

### User Management

- [[TC-USER-001]] - Create Internal User
- [[TC-USER-002]] - Update User Profile & Role
- [[TC-USER-003]] - Deactivate User Blocks Access
- [[TC-USER-004]] - Create User Validation Errors
- [[TC-USER-005]] - Reactivate User Restores Access

### Dashboard

- [[TC-DASH-001]] - Dashboard Metrics Verification
- [[TC-DASH-002]] - Dashboard KPI Calculations
- [[TC-DASH-003]] - Order Status Widget Counts
- [[TC-DASH-004]] - Top Products Widget
- [[TC-DASH-005]] - Low Stock Alerts
- [[TC-DASH-006]] - Recent Activities Feed
- [[TC-DASH-007]] - Dashboard Load Performance
- [[TC-DASH-008]] - Top Customers Widget
- [[TC-DASH-009]] - Unread Chat Count Widget
- [[TC-DASH-010]] - Dashboard Date Range Filter
- [[TC-DASH-011]] - Dashboard Empty State

### Security

- [[TC-SEC-001]] - Unauthorized API Access Blocked
- [[TC-SEC-002]] - Role Escalation Attempt Blocked
- [[TC-SEC-003]] - SQL Injection Attempt Blocked
- [[TC-SEC-004]] - XSS Injection Blocked in Chat Messages
- [[TC-SEC-005]] - Sensitive Data Not Exposed in Responses
- [[TC-SEC-006]] - Session Cookie Security Flags
- [[TC-SEC-007]] - File Upload Validation
- [[TC-SEC-008]] - CSRF Protection on State-Changing Requests
- [[TC-SEC-009]] - Rate Limiting on Login Attempts
- [[TC-SEC-010]] - RLS Policy Enforcement for Customers and Orders

### Cross-Feature Integration

- [[TC-INT-001]] - Create Product then Create Order (Stock Decrease + Low Stock)
- [[TC-INT-002]] - Multi-Product Order (In-stock + Pre-order)
- [[TC-INT-003]] - Multi-Product Order with Out-of-Stock Item
- [[TC-INT-004]] - Order Creates Customer and Updates History
- [[TC-INT-005]] - Payment Updates Order Status and Dashboard KPIs
- [[TC-INT-006]] - Supplier Order Received Unlocks Shipping
- [[TC-INT-007]] - Order Cancel Restores Stock and Updates Dashboard Low Stock
- [[TC-INT-008]] - Cancel Paid Order Updates Accounting Totals
- [[TC-INT-009]] - Concurrent Orders for Same Stock
- [[TC-INT-010]] - Double-Submit Create Order Prevented
- [[TC-INT-011]] - Retry After Create Order Failure
- [[TC-INT-012]] - Concurrent Payment Submissions
- [[TC-INT-013]] - Concurrent Supplier Order Status Update
- [[TC-INT-014]] - Order Creation Transaction Rollback
- [[TC-INT-015]] - Manual Stock Increase Reflects in Catalog Availability
- [[TC-INT-016]] - Idempotent Create Order by Client Token
- [[TC-INT-017]] - Idempotent Create Order with Different Payload
- [[TC-INT-018]] - Idempotent Add Payment by Client Token
- [[TC-INT-019]] - Idempotent Add Payment with Different Payload
- [[TC-INT-020]] - Idempotent Cancel Order Request

## Reports

Directory: `docs/035-QA/Reports/`

## Automation

Directory: `docs/035-QA/Automation/`
