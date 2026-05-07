"use client";

import { useQuery } from "@tanstack/react-query";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import {
  Check,
  ChevronsUpDown,
  Loader2,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  User,
} from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce"; // Ensure this pkg is installed or use custom hook
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface CustomerSelectorProps {
  selectedCustomer: CustomerStatsItem | null;
  onSelectCustomer: (customer: CustomerStatsItem | null) => void;
  newCustomer: { name: string; phone: string } | null;
  onNewCustomerChange: (data: { name: string; phone: string } | null) => void;
}

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
  newCustomer,
  onNewCustomerChange,
}: CustomerSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch] = useDebounce(searchQuery, 300);
  const selectedCustomerId = selectedCustomer?.id;

  const { data: customersData, isLoading } = useQuery({
    queryKey: queryKeys.customers.search(debouncedSearch),
    queryFn: () => adminClient.getCustomers({ search: debouncedSearch, limit: 10 }),
    enabled: open, // Only fetch when open
  });

  const customers: CustomerStatsItem[] = customersData?.data || [];

  const handleCreateNewClick = () => {
    onSelectCustomer(null);
    onNewCustomerChange({ name: searchQuery, phone: "" });
    setOpen(false);
  };

  const handleClear = () => {
    onSelectCustomer(null);
    onNewCustomerChange(null);
    setSearchQuery("");
  };

  if (selectedCustomer) {
    return (
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium">{selectedCustomer.fullName}</p>
              {selectedCustomer.customerCode && (
                <p className="text-xs text-muted-foreground">
                  Mã KH: {selectedCustomer.customerCode}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Thay đổi
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{selectedCustomer.phone || "Chưa có SĐT"}</span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2 break-words">
              {selectedCustomer.address || "Chưa có địa chỉ"}
            </span>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" />
            {selectedCustomer.orderCount ?? 0} đơn
          </span>
          <span>Tổng chi: {formatCurrency(Number(selectedCustomer.totalSpent ?? 0))}</span>
        </div>
      </div>
    );
  }

  if (newCustomer) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium">
            <Plus className="h-4 w-4" /> Khách hàng mới
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Hủy
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="new-name">Tên khách hàng</FieldLabel>
            <Input
              id="new-name"
              value={newCustomer.name}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, name: e.target.value })}
              placeholder="Nhập tên khách hàng"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="new-phone">Số điện thoại (tuỳ chọn)</FieldLabel>
            <Input
              id="new-phone"
              value={newCustomer.phone}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, phone: e.target.value })}
              placeholder="Để trống nếu không có"
            />
          </Field>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-medium">Chọn khách hàng để bắt đầu</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tìm theo tên hoặc số điện thoại. Thông tin giao hàng sẽ tự điền sau khi chọn.
          </p>
        </div>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls="customer-combobox-list"
            className="w-full justify-between"
          >
            Tìm kiếm khách hàng...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] p-0 sm:w-100" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList id="customer-combobox-list">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm kiếm...
                </div>
              )}
              {!isLoading && customers.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm">
                  <p className="mb-2 text-muted-foreground">Không tìm thấy khách hàng.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={handleCreateNewClick}
                  >
                    <Plus className="h-3 w-3" />
                    Tạo mới "{searchQuery}"
                  </Button>
                </CommandEmpty>
              )}
              <CommandGroup heading="Khách hàng">
                {customers.map((customer: CustomerStatsItem) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => {
                      onSelectCustomer(customer);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomerId === customer.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.fullName}</span>
                      <span className="text-xs text-muted-foreground">
                        {customer.phone || "No phone"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
