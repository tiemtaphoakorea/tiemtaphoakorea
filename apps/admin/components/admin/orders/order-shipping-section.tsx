"use client";

import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Textarea } from "@workspace/ui/components/textarea";
import { Edit2, MapPin, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";

export interface OrderShippingSectionOrder {
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
}

export interface OrderShippingSectionCustomer {
  fullName: string;
  phone: string | null;
  address: string | null;
}

interface OrderShippingSectionProps {
  order: OrderShippingSectionOrder;
  customer: OrderShippingSectionCustomer;
  canEdit: boolean;
  onSave: (payload: {
    shippingName: string | null;
    shippingPhone: string | null;
    shippingAddress: string | null;
  }) => Promise<void>;
}

type Mode = "customer" | "custom";

export function OrderShippingSection({
  order,
  customer,
  canEdit,
  onSave,
}: OrderShippingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<Mode>(() => deriveMode(order, customer));
  const [name, setName] = useState(order.shippingName ?? "");
  const [phone, setPhone] = useState(order.shippingPhone ?? "");
  const [address, setAddress] = useState(order.shippingAddress ?? "");

  // Reset local state if order shipping changes externally (e.g. after save)
  useEffect(() => {
    if (!isEditing) {
      setMode(deriveMode(order, customer));
      setName(order.shippingName ?? "");
      setPhone(order.shippingPhone ?? "");
      setAddress(order.shippingAddress ?? "");
    }
  }, [order, customer, isEditing]);

  const hasShipping = Boolean(
    order.shippingName?.trim() || order.shippingPhone?.trim() || order.shippingAddress?.trim(),
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload =
        mode === "customer"
          ? {
              shippingName: customer.fullName ?? null,
              shippingPhone: customer.phone ?? null,
              shippingAddress: customer.address ?? null,
            }
          : {
              shippingName: name.trim() || null,
              shippingPhone: phone.trim() || null,
              shippingAddress: address.trim() || null,
            };
      await onSave(payload);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setMode(deriveMode(order, customer));
    setName(order.shippingName ?? "");
    setPhone(order.shippingPhone ?? "");
    setAddress(order.shippingAddress ?? "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-3 text-sm font-medium text-slate-600">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400">
          Giao hàng theo đơn
        </span>
        {canEdit && !isEditing && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setIsEditing(true)}
            className="h-7 gap-1 px-2 text-xs"
          >
            <Edit2 className="h-3 w-3" /> Sửa
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <RadioGroup value={mode} onValueChange={(v) => setMode(v as Mode)} className="grid gap-2">
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-card p-2.5 hover:bg-muted/30 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <RadioGroupItem value="customer" className="mt-0.5" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-foreground">Dùng địa chỉ khách hàng</span>
                <span className="text-muted-foreground">
                  {customer.address?.trim() || "Khách chưa có địa chỉ trong hồ sơ"}
                </span>
              </div>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-card p-2.5 hover:bg-muted/30 has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5">
              <RadioGroupItem value="custom" className="mt-0.5" />
              <div className="flex flex-col gap-0.5 text-xs">
                <span className="font-semibold text-foreground">Địa chỉ tùy chỉnh</span>
                <span className="text-muted-foreground">
                  Nhập tên, SĐT, địa chỉ riêng cho đơn này
                </span>
              </div>
            </label>
          </RadioGroup>

          {mode === "custom" && (
            <div className="space-y-2.5 rounded-md border border-border bg-card p-3">
              <Field>
                <FieldLabel>Người nhận</FieldLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Họ tên người nhận"
                />
              </Field>
              <Field>
                <FieldLabel>SĐT nhận hàng</FieldLabel>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Số liên hệ khi giao"
                />
              </Field>
              <Field>
                <FieldLabel>Địa chỉ giao hàng</FieldLabel>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="min-h-[72px]"
                />
              </Field>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} size="sm" className="flex-1">
              {isSaving ? "Đang lưu..." : "Lưu"}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Hủy
            </Button>
          </div>
        </div>
      ) : hasShipping ? (
        <>
          <div className="flex items-start gap-2">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{order.shippingName?.trim() || "—"}</span>
          </div>
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{order.shippingPhone?.trim() || "—"}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="whitespace-pre-wrap">{order.shippingAddress?.trim() || "—"}</span>
          </div>
        </>
      ) : (
        <p className="text-xs font-medium text-slate-500">Chưa nhập địa chỉ giao trên đơn.</p>
      )}
    </div>
  );
}

function deriveMode(
  order: OrderShippingSectionOrder,
  customer: OrderShippingSectionCustomer,
): Mode {
  const orderAddr = order.shippingAddress?.trim() ?? "";
  const customerAddr = customer.address?.trim() ?? "";
  const orderName = order.shippingName?.trim() ?? "";
  const customerName = customer.fullName?.trim() ?? "";
  const orderPhone = order.shippingPhone?.trim() ?? "";
  const customerPhone = customer.phone?.trim() ?? "";
  // Treat as "customer mode" when all three fields match the customer profile
  // OR when the order has no shipping at all (default suggestion).
  if (!orderAddr && !orderName && !orderPhone) return "customer";
  if (orderAddr === customerAddr && orderName === customerName && orderPhone === customerPhone) {
    return "customer";
  }
  return "custom";
}
