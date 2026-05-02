"use client";

import { useMutation } from "@tanstack/react-query";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import type {
  OrderBuilderItem,
  OrderProductSelection,
  OrderProductVariant,
} from "@workspace/database/types/order";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { Loader2, Save, ShoppingCart, Truck } from "lucide-react";
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
  const [shippingName, setShippingName] = React.useState("");
  const [shippingPhone, setShippingPhone] = React.useState("");
  const [shippingAddress, setShippingAddress] = React.useState("");
  const [advanceShipping, setAdvanceShipping] = React.useState(false);
  const [shippingFee, setShippingFee] = React.useState(0);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Validate inputs
      if (!selectedCustomer && !newCustomer?.name) {
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
          ...(i.customPrice != null && { customPrice: i.customPrice }),
        })),
        note,
        deliveryPreference: "ship_together", // Default for now
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
          available: variant.onHand - variant.reserved,
        },
      ];
    });
    toast.success("Đã thêm sản phẩm vào đơn");
  };

  const handleUpdateQuantity = (variantId: string, quantity: number) => {
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)));
  };

  const handleUpdatePrice = (variantId: string, customPrice: number) => {
    setItems((prev) => prev.map((i) => (i.variantId === variantId ? { ...i, customPrice } : i)));
  };

  const handleRemoveItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const subtotal = items.reduce(
    (acc, item) => acc + (item.customPrice ?? item.price) * item.quantity,
    0,
  );
  const effectiveShippingFee = advanceShipping ? shippingFee : 0;
  const total = subtotal + effectiveShippingFee;

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
              onUpdatePrice={handleUpdatePrice}
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
            <CardTitle className="text-lg">Địa chỉ giao hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="ship-name">Người nhận</FieldLabel>
                <Input
                  id="ship-name"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="Họ tên người nhận (tuỳ chọn)"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ship-phone">SĐT nhận hàng</FieldLabel>
                <Input
                  id="ship-phone"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="Số liên hệ khi giao (tuỳ chọn)"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="ship-address">Địa chỉ giao hàng</FieldLabel>
                <Textarea
                  id="ship-address"
                  className="min-h-[80px]"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Phí ship
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Field>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <FieldLabel htmlFor="advance-shipping" className="cursor-pointer">
                    Trả phí ship hộ khách
                  </FieldLabel>
                  <FieldDescription>
                    Cộng vào tổng đơn để khách hoàn lại khi nhận hàng.
                  </FieldDescription>
                </div>
                <Switch
                  id="advance-shipping"
                  checked={advanceShipping}
                  onCheckedChange={(v) => {
                    setAdvanceShipping(v);
                    if (!v) setShippingFee(0);
                  }}
                />
              </div>
            </Field>
            {advanceShipping && (
              <Field className="mt-3">
                <FieldLabel htmlFor="shipping-fee">Số tiền (VND)</FieldLabel>
                <NumberInput
                  id="shipping-fee"
                  value={shippingFee}
                  onValueChange={(values) => setShippingFee(values.floatValue ?? 0)}
                  placeholder="0"
                  decimalScale={0}
                />
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính:</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            {effectiveShippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phí ship trả hộ:</span>
                <span className="tabular-nums">{formatCurrency(effectiveShippingFee)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg pt-4 border-t">
              <span>Tổng cộng:</span>
              <span className="text-primary tabular-nums">{formatCurrency(total)}</span>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => createOrderMutation.mutate()}
              disabled={
                createOrderMutation.isPending ||
                (!selectedCustomer && !newCustomer?.name) ||
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
