"use client";

import { Field, FieldDescription, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { NumberInput } from "@workspace/ui/components/number-input";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";

interface OrderInfoFormProps {
  note: string;
  onNoteChange: (value: string) => void;
  shippingName: string;
  onShippingNameChange: (value: string) => void;
  shippingPhone: string;
  onShippingPhoneChange: (value: string) => void;
  shippingAddress: string;
  onShippingAddressChange: (value: string) => void;
  advanceShipping: boolean;
  onAdvanceShippingChange: (value: boolean) => void;
  shippingFee: number;
  onShippingFeeChange: (value: number) => void;
}

// Inline panel — always visible alongside the customer card.
// Auto-fills from the selected customer; admin can edit before submit.
export function OrderInfoForm(props: OrderInfoFormProps) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium">Thông tin giao hàng & ghi chú</h3>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="ship-name">Người nhận</FieldLabel>
          <Input
            id="ship-name"
            value={props.shippingName}
            onChange={(e) => props.onShippingNameChange(e.target.value)}
            placeholder="Họ tên người nhận"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="ship-phone">SĐT nhận hàng</FieldLabel>
          <Input
            id="ship-phone"
            value={props.shippingPhone}
            onChange={(e) => props.onShippingPhoneChange(e.target.value)}
            placeholder="Số liên hệ khi giao"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="ship-address">Địa chỉ giao hàng</FieldLabel>
          <Textarea
            id="ship-address"
            className="min-h-20"
            value={props.shippingAddress}
            onChange={(e) => props.onShippingAddressChange(e.target.value)}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
          />
        </Field>
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
              checked={props.advanceShipping}
              onCheckedChange={(v) => {
                props.onAdvanceShippingChange(v);
                if (!v) props.onShippingFeeChange(0);
              }}
            />
          </div>
        </Field>
        {props.advanceShipping && (
          <Field>
            <FieldLabel htmlFor="shipping-fee">Số tiền (VND)</FieldLabel>
            <NumberInput
              id="shipping-fee"
              value={props.shippingFee}
              onValueChange={(values) => props.onShippingFeeChange(values.floatValue ?? 0)}
              placeholder="0"
              decimalScale={0}
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="order-note">Ghi chú đơn hàng</FieldLabel>
          <Textarea
            id="order-note"
            className="min-h-20"
            value={props.note}
            onChange={(e) => props.onNoteChange(e.target.value)}
            placeholder="Ghi chú nội bộ cho đơn hàng..."
          />
        </Field>
      </FieldGroup>
    </div>
  );
}
