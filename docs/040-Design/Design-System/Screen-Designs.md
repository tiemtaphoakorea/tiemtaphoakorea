# Admin Screen Designs

This document defines the specific UI layouts for key screens in the Auth Shop Admin, applying the "Modern Glass Minimal" system.

## 1. Common Layout Patterns

### A. The "Listing" Page (Products, Orders, Customers)

Used for: `/products`, `/orders`, `/customers`, `/users`, `/expenses`.

**Structure:**

1.  **Header Area (Sticky):**
    - **Left:** Page Title (H1) + Total Count (Badge).
    - **Right:** Primary Action (e.g., "Add Product") + Secondary Server Actions (Export, Print).
2.  **Filter Bar (Glass Card):**
    - `bg-white/50 backdrop-blur-sm border-b border-border/50`.
    - Search Input (Wide).
    - Filter Dropdowns (Status, Date Range).
    - View Toggle (List/Grid - optional).
3.  **Data Table (Surface):**
    - `bg-white rounded-xl border border-border shadow-sm`.
    - **Header:** `bg-muted/30 text-muted-foreground font-medium`.
    - **Rows:** `hover:bg-muted/20 cursor-pointer transition-colors`.
    - **Status Badges:** Subtle backgrounds (e.g., `bg-green-100 text-green-700`).

### B. The "Dashboard" Page (`/`)

**Structure:**

1.  **Welcome Section:**
    - Greeting + Date.
2.  **Metrics Grid:**
    - 4-Column Grid.
    - **Cards:** `bg-white p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all`.
    - **Content:** Icon (Top Left), Value (Large), Label (Muted), Trend (Green/Red badge).
3.  **Charts Section:**
    - 2-Column Grid (Revenue vs. Orders).
    - **Container:** Glass Card effect `bg-white/80`.
4.  **Recent Activity:**
    - List of recent orders/logs.

## 2. Screen-Specific Specs

### Dashboard (`/`)

- **Hero Cards:** Revenue, Orders, Customers, Growth.
- **Visuals:** Area Charts with gradient fills (green/blue).

### Products (`/products`)

- **Table Columns:** Image (Thumbnail), Name, Category, Price, Stock (Color-coded: Low=Red), Status.
- **Server Actions:** Edit (Icon), Delete (Icon), Duplicate.

### Orders (`/orders`)

- **Table Columns:** ID (#Order), Customer, Date, Total, Payment Status, Delivery Status.
- **Details Panel:** Clicking a row opens a **Sheet (Side Drawer)** instead of a full page navigation for quick preview.

### Chat (`/chat`)

- **Layout:** Two-Pane (Sidebar + Conversation).
- **Sidebar:** List of users/conversations. `bg-white border-r border-border`.
- **Main:** `bg-muted/20`.
- **Bubbles:**
  - Admin: `bg-primary text-white`.
  - User: `bg-white border border-border`.

### Settings (`/settings`)

- **Layout:** Vertical Tabs (Left) + Content Area (Right).
- **Tabs:** Profile, Security, Notifications, Team.
- **Content:** Card-based forms.

## 3. Implementation Priorities

1.  **Global Tweaks:** Fix background color and sidebar border.
2.  **Dashboard:** Implement Metrics Cards and Chart containers.
3.  **Listing Template:** Create a reusable `DataTable` wrapper with the new styling.
