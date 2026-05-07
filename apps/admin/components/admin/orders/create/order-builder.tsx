"use client";

import { useMutation } from "@tanstack/react-query";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import type {
  OrderBuilderItem,
  OrderProductSelection,
  OrderProductVariant,
} from "@workspace/database/types/order";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/admin.client";

import { CustomerSelector } from "./customer-selector";
import { OrderAddRow } from "./order-add-row";
import type { CartSortMode } from "./order-cart-toolbar";
import { OrderCartToolbar } from "./order-cart-toolbar";
import { OrderInfoForm } from "./order-info-form";
import { OrderItemsTable } from "./order-items-table";
import { OrderSummaryBar } from "./order-summary-bar";
import { PasteSkusDialog } from "./paste-skus-dialog";

function buildItem(
  variant: OrderProductVariant,
  product: OrderProductSelection,
  quantity: number,
): OrderBuilderItem {
  return {
    variantId: variant.id,
    productId: product.id,
    variantName: variant.name,
    productName: product.name,
    sku: variant.sku,
    price: Number(variant.price),
    quantity,
    available: variant.onHand - variant.reserved,
    addedAt: Date.now(),
  };
}

function sortItems(items: OrderBuilderItem[], mode: CartSortMode): OrderBuilderItem[] {
  if (mode === "added") return [...items].sort((a, b) => a.addedAt - b.addedAt);
  return [...items].sort((a, b) => {
    switch (mode) {
      case "name":
        return (
          a.productName.localeCompare(b.productName) || a.variantName.localeCompare(b.variantName)
        );
      case "sku":
        return a.sku.localeCompare(b.sku);
      case "qty":
        return b.quantity - a.quantity;
      case "total": {
        const at = (a.customPrice ?? a.price) * a.quantity;
        const bt = (b.customPrice ?? b.price) * b.quantity;
        return bt - at;
      }
    }
  });
}

function filterItems(items: OrderBuilderItem[], query: string): OrderBuilderItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.productName.toLowerCase().includes(q) ||
      (i.variantName ?? "").toLowerCase().includes(q) ||
      i.sku.toLowerCase().includes(q),
  );
}

export function OrderBuilder() {
  const router = useRouter();

  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerStatsItem | null>(null);
  const [newCustomer, setNewCustomer] = React.useState<{ name: string; phone: string } | null>(
    null,
  );
  const [items, setItems] = React.useState<OrderBuilderItem[]>([]);
  const [note, setNote] = React.useState("");
  const [shippingName, setShippingName] = React.useState("");
  const [shippingPhone, setShippingPhone] = React.useState("");
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [advanceShipping, setAdvanceShipping] = React.useState(false);
  const [shippingFee, setShippingFee] = React.useState(0);

  const [cartSearch, setCartSearch] = React.useState("");
  const [sortMode, setSortMode] = React.useState<CartSortMode>("added");
  const [groupByProduct, setGroupByProduct] = React.useState(false);
  const [pasteOpen, setPasteOpen] = React.useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer && !newCustomer?.name) {
        throw new Error("Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng mới.");
      }
      if (items.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một sản phẩm.");
      }

      const payload = {
        customerId: selectedCustomer?.id,
        customerName: newCustomer?.name,
        customerPhone: newCustomer?.phone,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
          ...(i.customPrice != null && { customPrice: i.customPrice }),
        })),
        note,
        deliveryPreference: "ship_together",
        shippingName: shippingName.trim() || undefined,
        shippingPhone: shippingPhone.trim() || undefined,
        shippingAddress: shippingAddress.trim() || undefined,
        shippingFee: advanceShipping && shippingFee > 0 ? shippingFee : undefined,
      };

      return adminClient.createOrder(payload);
    },
    onSuccess: (data: any) => {
      if (data.success && data.order) {
        toast.success("Tạo đơn hàng thành công!");
        router.push(`/orders/${data.order.id}`);
      } else {
        toast.error("Có lỗi xảy ra khi tạo đơn hàng.");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Tạo đơn hàng thất bại.");
    },
  });

  const handleAddItem = React.useCallback(
    (variant: OrderProductVariant, product: OrderProductSelection, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === variant.id);
        if (existing) {
          return prev.map((i) =>
            i.variantId === variant.id ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [...prev, buildItem(variant, product, quantity)];
      });
      toast.success(`Đã thêm ${variant.name || product.name}`);
    },
    [],
  );

  const handleAddBulk = React.useCallback(
    (
      payload: Array<{
        variant: OrderProductVariant;
        product: OrderProductSelection;
        quantity: number;
      }>,
    ) => {
      setItems((prev) => {
        const next = [...prev];
        for (const { variant, product, quantity } of payload) {
          const idx = next.findIndex((i) => i.variantId === variant.id);
          if (idx >= 0) {
            next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          } else {
            next.push(buildItem(variant, product, quantity));
          }
        }
        return next;
      });
    },
    [],
  );

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
  };
  const handleUpdatePrice = (variantId: string, customPrice: number) => {
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, customPrice } : i)));
  };
  const handleRemoveItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const displayedItems = React.useMemo(
    () => sortItems(filterItems(items, cartSearch), sortMode),
    [items, cartSearch, sortMode],
  );

  const subtotal = items.reduce(
    (acc, item) => acc + (item.customPrice ?? item.price) * item.quantity,
    0,
  );
  const totalQuantity = items.reduce((acc, i) => acc + i.quantity, 0);
  const effectiveShippingFee = advanceShipping ? shippingFee : 0;
  const total = subtotal + effectiveShippingFee;
  const canSubmit = (!!selectedCustomer || !!newCustomer?.name) && items.length > 0;
  const hasCustomer = !!selectedCustomer || !!newCustomer;

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Top: 2-col when customer is selected, else single-col full-width picker */}
      <div
        className={
          hasCustomer ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]" : ""
        }
      >
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setNewCustomer(null);
            // Auto-fill shipping fields when still empty.
            if (c) {
              if (!shippingName.trim() && c.fullName) setShippingName(c.fullName);
              if (!shippingPhone.trim() && c.phone) setShippingPhone(c.phone);
              if (!shippingAddress.trim() && c.address) setShippingAddress(c.address);
            }
          }}
          newCustomer={newCustomer}
          onNewCustomerChange={(nc) => {
            setNewCustomer(nc);
            setSelectedCustomer(null);
            if (nc) {
              if (!shippingName.trim() && nc.name) setShippingName(nc.name);
              if (!shippingPhone.trim() && nc.phone) setShippingPhone(nc.phone);
            }
          }}
        />
        {hasCustomer && (
          <OrderInfoForm
            note={note}
            onNoteChange={setNote}
            shippingName={shippingName}
            onShippingNameChange={setShippingName}
            shippingPhone={shippingPhone}
            onShippingPhoneChange={setShippingPhone}
            shippingAddress={shippingAddress}
            onShippingAddressChange={setShippingAddress}
            advanceShipping={advanceShipping}
            onAdvanceShippingChange={setAdvanceShipping}
            shippingFee={shippingFee}
            onShippingFeeChange={setShippingFee}
          />
        )}
      </div>

      {/* Add product row + bulk pickers */}
      <OrderAddRow
        onAddItem={(v, p) => handleAddItem(v, p, 1)}
        onAddBulk={handleAddBulk}
        onOpenPasteDialog={() => setPasteOpen(true)}
      />

      {/* Cart toolbar — only when there are items to filter/sort/group */}
      {items.length > 0 && (
        <OrderCartToolbar
          cartSearch={cartSearch}
          onCartSearchChange={setCartSearch}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          groupByProduct={groupByProduct}
          onGroupByProductChange={setGroupByProduct}
          itemCount={items.length}
        />
      )}

      {/* Cart table */}
      <OrderItemsTable
        items={displayedItems}
        groupByProduct={groupByProduct}
        onUpdateQuantity={handleUpdateQuantity}
        onUpdatePrice={handleUpdatePrice}
        onRemoveItem={handleRemoveItem}
      />

      {/* Sticky summary + CTA */}
      <OrderSummaryBar
        itemCount={items.length}
        totalQuantity={totalQuantity}
        subtotal={subtotal}
        shippingFee={effectiveShippingFee}
        total={total}
        canSubmit={canSubmit}
        isSubmitting={createOrderMutation.isPending}
        onSubmit={() => createOrderMutation.mutate()}
      />

      <PasteSkusDialog open={pasteOpen} onOpenChange={setPasteOpen} onAddItems={handleAddBulk} />
    </div>
  );
}
