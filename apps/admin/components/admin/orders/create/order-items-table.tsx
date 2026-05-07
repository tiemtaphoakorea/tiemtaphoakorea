"use client";

import type { OrderBuilderItem } from "@workspace/database/types/order";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { PackageOpen } from "lucide-react";
import { OrderCartCard } from "./order-cart-card";
import { OrderCartRow } from "./order-cart-row";

interface OrderItemsTableProps {
  items: OrderBuilderItem[];
  groupByProduct: boolean;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onUpdatePrice: (variantId: string, price: number) => void;
  onRemoveItem: (variantId: string) => void;
}

interface ItemGroup {
  productId: string;
  productName: string;
  items: OrderBuilderItem[];
}

function buildGroups(items: OrderBuilderItem[]): ItemGroup[] {
  const map = new Map<string, ItemGroup>();
  for (const item of items) {
    const existing = map.get(item.productId);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        items: [item],
      });
    }
  }
  return Array.from(map.values());
}

export function OrderItemsTable({
  items,
  groupByProduct,
  onUpdateQuantity,
  onUpdatePrice,
  onRemoveItem,
}: OrderItemsTableProps) {
  if (items.length === 0) {
    return (
      <Empty bordered className="min-h-40 bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageOpen />
          </EmptyMedia>
          <EmptyTitle>Chưa có sản phẩm nào</EmptyTitle>
          <EmptyDescription>
            Gõ tên/SKU vào ô tìm sản phẩm phía trên hoặc dán danh sách SKU để bắt đầu.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const groups = groupByProduct ? buildGroups(items) : null;

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="min-w-64">Sản phẩm · SKU</TableHead>
                <TableHead className="w-36 text-right">Đơn giá</TableHead>
                <TableHead className="w-16 text-center">Tồn</TableHead>
                <TableHead className="w-44 text-center">Số lượng</TableHead>
                <TableHead className="w-32 text-right">Thành tiền</TableHead>
                <TableHead className="w-12 text-center"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups
                ? groups.flatMap((group, gi) => {
                    const startIndex = groups
                      .slice(0, gi)
                      .reduce((acc, g) => acc + g.items.length, 0);
                    return [
                      <TableRow key={`group-${group.productId}`} className="bg-muted/50">
                        <TableCell
                          colSpan={7}
                          className="py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {group.productName}{" "}
                          <span className="ml-1 font-normal normal-case text-muted-foreground/70">
                            ({group.items.length} dòng)
                          </span>
                        </TableCell>
                      </TableRow>,
                      ...group.items.map((item, i) => (
                        <OrderCartRow
                          key={item.variantId}
                          index={startIndex + i}
                          item={item}
                          onUpdateQuantity={onUpdateQuantity}
                          onUpdatePrice={onUpdatePrice}
                          onRemoveItem={onRemoveItem}
                        />
                      )),
                    ];
                  })
                : items.map((item, i) => (
                    <OrderCartRow
                      key={item.variantId}
                      index={i}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onUpdatePrice={onUpdatePrice}
                      onRemoveItem={onRemoveItem}
                    />
                  ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        {groups
          ? groups.flatMap((group, gi) => {
              const startIndex = groups.slice(0, gi).reduce((acc, g) => acc + g.items.length, 0);
              return [
                <div
                  key={`group-${group.productId}`}
                  className="bg-muted/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {group.productName}
                  <span className="ml-1 font-normal normal-case text-muted-foreground/70">
                    ({group.items.length})
                  </span>
                </div>,
                ...group.items.map((item, i) => (
                  <OrderCartCard
                    key={item.variantId}
                    index={startIndex + i}
                    item={item}
                    onUpdateQuantity={onUpdateQuantity}
                    onUpdatePrice={onUpdatePrice}
                    onRemoveItem={onRemoveItem}
                  />
                )),
              ];
            })
          : items.map((item, i) => (
              <OrderCartCard
                key={item.variantId}
                index={i}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdatePrice={onUpdatePrice}
                onRemoveItem={onRemoveItem}
              />
            ))}
      </div>
    </div>
  );
}
