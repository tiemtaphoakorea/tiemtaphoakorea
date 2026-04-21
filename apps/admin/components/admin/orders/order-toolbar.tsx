import type { FulfillmentStatusValue, PaymentStatusValue } from "@workspace/shared/constants";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { AlertCircle, ChevronDown, Filter, Search } from "lucide-react";

interface OrderToolbarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  paymentStatus: string;
  onPaymentStatusChange: (val: string) => void;
  fulfillmentStatus: string;
  onFulfillmentStatusChange: (val: string) => void;
  debtOnly: boolean;
  onDebtOnlyToggle: () => void;
  paymentBadge: Record<PaymentStatusValue, { label: string; className: string }>;
  fulfillmentBadge: Record<FulfillmentStatusValue, { label: string; className: string }>;
}

export function OrderToolbar({
  searchTerm,
  onSearchChange,
  paymentStatus,
  onPaymentStatusChange,
  fulfillmentStatus,
  onFulfillmentStatusChange,
  debtOnly,
  onDebtOnlyToggle,
  paymentBadge,
  fulfillmentBadge,
}: OrderToolbarProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="relative max-w-sm flex-1">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Tìm mã đơn hàng, khách hàng..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 font-bold">
              <Filter className="h-4 w-4" />
              {paymentStatus === "All"
                ? "Tất cả thanh toán"
                : paymentBadge[paymentStatus as PaymentStatusValue]?.label || paymentStatus}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-bold">
            <DropdownMenuLabel>Lọc theo thanh toán</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPaymentStatusChange("All")}>Tất cả</DropdownMenuItem>
            {(Object.entries(paymentBadge) as [PaymentStatusValue, { label: string }][]).map(
              ([key, config]) => (
                <DropdownMenuItem key={key} onClick={() => onPaymentStatusChange(key)}>
                  {config.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-10 gap-2 font-bold">
              <Filter className="h-4 w-4" />
              {fulfillmentStatus === "All"
                ? "Tất cả xử lý"
                : fulfillmentBadge[fulfillmentStatus as FulfillmentStatusValue]?.label ||
                  fulfillmentStatus}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-bold">
            <DropdownMenuLabel>Lọc theo xử lý</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onFulfillmentStatusChange("All")}>
              Tất cả
            </DropdownMenuItem>
            {(
              Object.entries(fulfillmentBadge) as [FulfillmentStatusValue, { label: string }][]
            ).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => onFulfillmentStatusChange(key)}>
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant={debtOnly ? "default" : "outline"}
          className="h-10 gap-2 font-bold"
          onClick={onDebtOnlyToggle}
        >
          <AlertCircle className="h-4 w-4 text-red-500" />
          Công nợ
        </Button>
      </div>
    </div>
  );
}
