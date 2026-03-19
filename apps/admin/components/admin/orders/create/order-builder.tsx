"use client";

import type { CustomerStatsItem } from "@repo/database/types/admin";
import type {
  OrderBuilderItem,
  OrderProductSelection,
  OrderProductVariant,
} from "@repo/database/types/order";
import { formatCurrency } from "@repo/shared/utils";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Textarea } from "@repo/ui/components/textarea";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner"; // Assuming sonner or use-toast is used
import { adminClient } from "@/services/admin.client";

import { CustomerSelector } from "./customer-selector";
import { OrderItemsTable } from "./order-items-table";
import { ProductSelector } from "./product-selector";

export function OrderBuilder() {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerStatsItem | null>(null);
  const [newCustomer, setNewCustomer] = React.useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [items, setItems] = React.useState<OrderBuilderItem[]>([]);
  const [note, setNote] = React.useState("");

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      if (!selectedCustomer && (!newCustomer?.name || !newCustomer?.phone)) {
        throw new Error("Vui lòng chọn khách hàng hoặc nhập thông tin khách hàng mới.");
      }
      if (items.length === 0) {
        throw new Error("Vui lòng thêm ít nhất một sản phẩm.");
      }

      // Prepare payload
      const payload = {
        customerId: selectedCustomer?.id,
        customerName: newCustomer?.name,
        customerPhone: newCustomer?.phone,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        note,
        deliveryPreference: "ship_together", // Default for now
      };

      return adminClient.createOrder(payload as any);
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

  const handleAddItem = (variant: OrderProductVariant, product: OrderProductSelection) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          variantName: variant.name,
          productName: product.name,
          sku: variant.sku,
          price: Number(variant.price),
          quantity: 1,
          stock: Number(variant.stockQuantity),
        },
      ];
    });
    toast.success("Đã thêm sản phẩm vào đơn");
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
  };

  const handleRemoveItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 h-full">
      {/* Left Column: Customer & Items */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={(c) => {
                setSelectedCustomer(c);
                setNewCustomer(null);
              }}
              newCustomer={newCustomer}
              onNewCustomerChange={(nc) => {
                setNewCustomer(nc);
                setSelectedCustomer(null);
              }}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProductSelector onSelectVariant={handleAddItem} />
            <OrderItemsTable
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Summary & Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghi chú đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ghi chú nội bộ cho đơn hàng..."
              className="min-h-[100px]"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {/* Add tax/shipping here if needed in future */}

            <div className="flex justify-between font-bold text-lg pt-4 border-t">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(subtotal)}</span>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => createOrderMutation.mutate()}
              disabled={
                createOrderMutation.isPending ||
                (!selectedCustomer && (!newCustomer?.name || !newCustomer?.phone)) ||
                items.length === 0
              }
            >
              {createOrderMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Tạo đơn hàng
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
