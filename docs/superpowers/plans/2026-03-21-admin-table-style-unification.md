# Admin Table Style Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove custom header styling overrides from all 9 admin table components so they use the shadcn default (Option B: clean, sentence-case, no header background).

**Architecture:** Each table file has overrides on `TableHeader`, `TableRow` (in header), and `TableHead` that apply a dark/bold/uppercase style. Removing these lets the base `packages/ui/src/components/table.tsx` defaults take over: `font-medium text-foreground` headers, `hover:bg-muted/50` rows, no background.

**Tech Stack:** React, Tailwind CSS, shadcn/ui table primitives

---

### Task 1: order-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/orders/order-table.tsx`

- [ ] **Step 1: Remove header background from TableHeader**

  Change:
  ```tsx
  <TableHeader className="border-b border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
  ```
  To:
  ```tsx
  <TableHeader>
  ```

- [ ] **Step 2: Remove uppercase styling from all TableHead cells**

  Change all `TableHead` cells — remove `text-xs font-bold text-slate-500 uppercase`. Keep only alignment classes.

  ```tsx
  <TableHead>Mã đơn</TableHead>
  <TableHead>Khách hàng</TableHead>
  <TableHead>Trạng thái</TableHead>
  <TableHead className="text-right">Tổng tiền</TableHead>
  <TableHead className="text-center">Ngày tạo</TableHead>
  <TableHead className="w-[140px]"></TableHead>
  ```

- [ ] **Step 3: Clean up body TableRow**

  Change:
  ```tsx
  className="border-slate-100 hover:bg-slate-50/50 dark:border-slate-800"
  ```
  To: remove className entirely (base handles border and hover).

- [ ] **Step 4: Commit**
  ```bash
  git add apps/admin/components/admin/orders/order-table.tsx
  git commit -m "style: unify order-table to shadcn default style"
  ```

---

### Task 2: customer-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/customers/customer-table.tsx`

- [ ] **Step 1: Remove header background from TableHeader**

  Change:
  ```tsx
  <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
  ```
  To:
  ```tsx
  <TableHeader>
  ```

- [ ] **Step 2: Remove hover override from header TableRow**

  Change:
  ```tsx
  <TableRow className="hover:bg-transparent">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 3: Remove uppercase styling from all TableHead cells**

  Remove `text-[10px] font-black tracking-widest text-slate-400 uppercase` from every `TableHead`. Keep only structural classes like `w-[80px] text-center` and `w-[50px]`.

  ```tsx
  <TableHead className="w-[80px] text-center">Avatar</TableHead>
  <TableHead>Khách hàng</TableHead>
  <TableHead>Liên hệ</TableHead>
  <TableHead>Đơn hàng</TableHead>
  <TableHead>Tổng chi tiêu</TableHead>
  <TableHead>Trạng thái</TableHead>
  <TableHead className="w-[50px]"></TableHead>
  ```

- [ ] **Step 4: Clean up body TableRow hover**

  Change:
  ```tsx
  className="group cursor-pointer transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
  ```
  To:
  ```tsx
  className="group cursor-pointer transition-colors"
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add apps/admin/components/admin/customers/customer-table.tsx
  git commit -m "style: unify customer-table to shadcn default style"
  ```

---

### Task 3: product-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/products/product-table.tsx`

- [ ] **Step 1: Remove hover override and border from header TableRow**

  Change:
  ```tsx
  <TableRow className="border-slate-100 hover:bg-transparent dark:border-slate-800">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 2: Remove uppercase styling from all TableHead cells**

  Remove `text-xs font-black uppercase` from every `TableHead`. Keep only alignment classes.

  ```tsx
  <TableHead>Sản phẩm</TableHead>
  <TableHead>Danh mục</TableHead>
  <TableHead className="text-right">Giá bán</TableHead>
  <TableHead className="text-center">Tồn kho</TableHead>
  <TableHead className="w-[50px]"></TableHead>
  ```

- [ ] **Step 3: Clean up body TableRow hover**

  Change:
  ```tsx
  className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/50"
  ```
  To: remove className entirely.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/admin/components/admin/products/product-table.tsx
  git commit -m "style: unify product-table to shadcn default style"
  ```

---

### Task 4: supplier-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/suppliers/supplier-table.tsx`

- [ ] **Step 1: Remove header background from TableHeader**

  Change:
  ```tsx
  <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
  ```
  To:
  ```tsx
  <TableHeader>
  ```

- [ ] **Step 2: Remove hover override from header TableRow**

  Change:
  ```tsx
  <TableRow className="hover:bg-transparent">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 3: Remove uppercase styling from all TableHead cells**

  Remove `text-[10px] font-black tracking-widest text-slate-400 uppercase` from every `TableHead`. Keep `w-[50px]`.

  ```tsx
  <TableHead>Mã NCC</TableHead>
  <TableHead>Nhà cung cấp</TableHead>
  <TableHead>Liên hệ</TableHead>
  <TableHead>Điều khoản thanh toán</TableHead>
  <TableHead>Số đơn hàng</TableHead>
  <TableHead>Trạng thái</TableHead>
  <TableHead className="w-[50px]"></TableHead>
  ```

- [ ] **Step 4: Clean up body TableRow hover**

  Change:
  ```tsx
  className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
  ```
  To:
  ```tsx
  className="group transition-colors"
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add apps/admin/components/admin/suppliers/supplier-table.tsx
  git commit -m "style: unify supplier-table to shadcn default style"
  ```

---

### Task 5: supplier-order-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/supplier-orders/supplier-order-table.tsx`

- [ ] **Step 1: Remove header background from TableHeader**

  Change:
  ```tsx
  <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
  ```
  To:
  ```tsx
  <TableHeader>
  ```

- [ ] **Step 2: Remove hover override from header TableRow**

  Change:
  ```tsx
  <TableRow className="hover:bg-transparent">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 3: Remove uppercase styling from all TableHead cells**

  Remove `text-[10px] font-black tracking-widest text-slate-400 uppercase` from every `TableHead`. Keep `w-[50px]`.

  ```tsx
  <TableHead>Mã đơn gốc</TableHead>
  <TableHead>Sản phẩm</TableHead>
  <TableHead>SL</TableHead>
  <TableHead>Trạng thái</TableHead>
  <TableHead>Ngày đặt</TableHead>
  <TableHead>Ngày về (Dự kiến)</TableHead>
  <TableHead className="w-[50px]"></TableHead>
  ```

- [ ] **Step 4: Clean up body TableRow hover**

  Change:
  ```tsx
  className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
  ```
  To:
  ```tsx
  className="group transition-colors"
  ```

- [ ] **Step 5: Commit**
  ```bash
  git add apps/admin/components/admin/supplier-orders/supplier-order-table.tsx
  git commit -m "style: unify supplier-order-table to shadcn default style"
  ```

---

### Task 6: orders/order-item-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/orders/order-item-table.tsx`

- [ ] **Step 1: Remove background from header TableRow**

  Change:
  ```tsx
  <TableRow className="bg-slate-50/50 hover:bg-transparent dark:bg-slate-900">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 2: Remove uppercase styling from all TableHead cells**

  Remove `text-[10px] font-black uppercase` from every `TableHead`. Keep alignment classes.

  ```tsx
  <TableHead className="w-[40%]">Sản phẩm</TableHead>
  <TableHead className="text-center">Số lượng</TableHead>
  <TableHead className="text-right">Đơn giá</TableHead>
  <TableHead className="text-right">Thành tiền</TableHead>
  <TableHead className="w-[50px]"></TableHead>
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add apps/admin/components/admin/orders/order-item-table.tsx
  git commit -m "style: unify order-item-table to shadcn default style"
  ```

---

### Task 7: order-detail/order-items-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/order-detail/order-items-table.tsx`

- [ ] **Step 1: Remove background from header TableRow**

  Change:
  ```tsx
  <TableRow className="bg-slate-50/50 hover:bg-transparent dark:bg-slate-900">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 2: Remove uppercase styling from all TableHead cells**

  Remove `text-[10px] font-black uppercase` from every `TableHead`. Keep alignment classes.

  ```tsx
  <TableHead className="w-[50%]">Sản phẩm</TableHead>
  <TableHead className="text-center">SL</TableHead>
  <TableHead className="text-right">Đơn giá</TableHead>
  <TableHead className="text-right">Tổng</TableHead>
  ```

- [ ] **Step 3: Commit**
  ```bash
  git add apps/admin/components/admin/order-detail/order-items-table.tsx
  git commit -m "style: unify order-detail items-table to shadcn default style"
  ```

---

### Task 8: customer-order-history-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/customer-detail/customer-order-history-table.tsx`

- [ ] **Step 1: Remove background from TableHeader**

  Change:
  ```tsx
  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
  ```
  To:
  ```tsx
  <TableHeader>
  ```

- [ ] **Step 2: Remove uppercase styling from all TableHead cells**

  Remove `px-8 text-[10px] font-black tracking-widest text-slate-400 uppercase` (keep `px-8` where it adds padding). Remove `text-[10px] font-black tracking-widest text-slate-400 uppercase` from others. Keep alignment.

  ```tsx
  <TableHead className="px-8">Mã đơn</TableHead>
  <TableHead>Ngày đặt</TableHead>
  <TableHead>Trạng thái</TableHead>
  <TableHead className="px-8 text-right">Tổng tiền</TableHead>
  <TableHead className="w-[150px]"></TableHead>
  ```

- [ ] **Step 3: Clean up body TableRow hover**

  Change:
  ```tsx
  className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
  ```
  To:
  ```tsx
  className="group transition-colors"
  ```

- [ ] **Step 4: Commit**
  ```bash
  git add apps/admin/components/admin/customer-detail/customer-order-history-table.tsx
  git commit -m "style: unify customer-order-history-table to shadcn default style"
  ```

---

### Task 9: orders/create/order-items-table.tsx

**Files:**
- Modify: `apps/admin/components/admin/orders/create/order-items-table.tsx`

- [ ] **Step 1: Remove background from header TableRow**

  This file is closest to Option B already (sentence-case headers). Only the header row background needs removing.

  Change:
  ```tsx
  <TableRow className="bg-muted/50">
  ```
  To:
  ```tsx
  <TableRow>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add apps/admin/components/admin/orders/create/order-items-table.tsx
  git commit -m "style: unify create order-items-table to shadcn default style"
  ```
