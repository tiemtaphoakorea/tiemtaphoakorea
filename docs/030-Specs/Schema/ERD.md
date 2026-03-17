---
id: SPEC-001
type: spec
status: draft
project: Auth Shop Platform
created: 2026-01-21
linked-to: [[SDD-AuthShopPlatform]], [[system-structure-analysis]]
---

# Database Schema & ERD

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ ORDERS : places
    PROFILES ||--o{ CHAT_ROOMS : participates
    PROFILES ||--o{ CHAT_MESSAGES : sends

    CATEGORIES ||--o{ PRODUCTS : contains
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCT_VARIANTS ||--o{ VARIANT_IMAGES : has
    PRODUCT_VARIANTS ||--o{ COST_PRICE_HISTORY : tracks

    ORDERS ||--o{ ORDER_ITEMS : contains
    ORDERS ||--o{ PAYMENTS : has
    ORDERS ||--o{ ORDER_STATUS_HISTORY : tracks

    ORDER_ITEMS ||--o{ SUPPLIER_ORDERS : triggers
    SUPPLIERS ||--o{ SUPPLIER_ORDERS : fulfills

    PROFILES {
        uuid id PK
        string username "Unique Login ID"
        string password_hash
        enum role "owner, manager, staff, customer"
        string full_name
        string phone
        string customer_code
    }

    PRODUCTS {
        uuid id PK
        string name
        uuid category_id FK
        string slug "Unique URL friendly name"
        text description
        boolean is_active
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        string sku "Stock Keeping Unit"
        decimal price "Selling Price"
        decimal cost_price "Original Cost"
        int stock_quantity
        enum status "active, inactive"
    }

    ORDERS {
        uuid id PK
        uuid customer_id FK
        enum status "pending, paid, preparing, shipping, delivered, cancelled"
        decimal total_amount
        decimal paid_amount
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        decimal amount
        enum method "cash, bank_transfer, credit, cod"
        string reference_code
        datetime created_at
    }

    EXPENSES {
        uuid id PK
        string description
        decimal amount
        enum type "fixed, variable, salary, marketing, operation"
        datetime incurred_at
        uuid created_by FK
    }
```

## 2. Table Details

### 2.1 Users & Auth (`profiles`)

Self-managed authentication table.

| Column          | Type | Description                                                                                 |
| :-------------- | :--- | :------------------------------------------------------------------------------------------ |
| `id`            | uuid | Primary Key                                                                                 |
| `username`      | text | Unique identifier for login                                                                 |
| `password_hash` | text | Bcrypt hash of password                                                                     |
| `role`          | enum | `owner` (Full Access), `manager` (No P&L), `staff` (Operations), `customer` (View Only/CRM) |
| `full_name`     | text | Display name                                                                                |
| `phone`         | text | Contact number                                                                              |
| `customer_code` | text | Unique code for CRM tracking (e.g., CUST-001)                                               |

### 2.2 Products (`products`, `product_variants`)

Core catalog structure.

- **Products**: The abstract item (e.g., "T-Shirt Basic").
- **Variants**: The concrete item (e.g., "T-Shirt Basic - Red - L").
- **Cost Price History**: Tracks changes in variable costs for precise P&L calculation over time.

### 2.3 Orders & Finance (`orders`, `payments`, `expenses`)

- **Orders**: The central transaction record.
- **Payments**: Records individual transactions. An order can have multiple payments (Partial Payment).
- **Expenses**: records operational costs not directly tied to COGS (Cost of Goods Sold).

### 2.4 Chat (`chat_rooms`, `messages`)

- **Rooms**: Can be linked to a specific Order or generic Customer Support.
- **Messages**: Text or Image content.

## 3. Row Level Security (RLS) Policies

### Internal Users (Owner, Manager, Staff)

- **Select**: Access to all operational data defined by Role Matrix.
- **Insert/Update**:
  - **Owner**: All tables.
  - **Manager**: All except `expenses` (if sensitive) and `profiles` (role promotion).
  - **Staff**: `orders` (create/update status), `chat` (send), `products` (view only or update stock).

### Customers

- **Select**: Own `orders`, Own `profile`. Public `products` (via public API or role bypass).
- **Insert**: `chat_messages` (contact-based ordering only, orders created by admin).
- **Update**: Own `profile` (limited).
