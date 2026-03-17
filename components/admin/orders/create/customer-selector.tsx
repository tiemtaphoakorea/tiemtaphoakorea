"use client";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Plus, User } from "lucide-react";
import * as React from "react";
import { useDebounce } from "use-debounce"; // Ensure this pkg is installed or use custom hook

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { adminClient } from "@/services/admin.client";
import type { CustomerStatsItem } from "@/types/admin";

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
    queryKey: ["customers", "search", debouncedSearch],
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
      <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{selectedCustomer.fullName}</p>
            <p className="text-sm text-muted-foreground">
              {selectedCustomer.phone || "Không có SĐT"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Thay đổi
        </Button>
      </div>
    );
  }

  if (newCustomer) {
    return (
      <div className="rounded-lg border p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" /> Khách hàng mới
          </h3>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Hủy
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-name">Tên khách hàng</Label>
            <Input
              id="new-name"
              value={newCustomer.name}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, name: e.target.value })}
              placeholder="Nhập tên khách hàng"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-phone">Số điện thoại</Label>
            <Input
              id="new-phone"
              value={newCustomer.phone}
              onChange={(e) => onNewCustomerChange({ ...newCustomer, phone: e.target.value })}
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Tìm kiếm khách hàng...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Tìm theo tên hoặc SĐT..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading && (
                <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm kiếm...
                </div>
              )}
              {!isLoading && customers.length === 0 && (
                <CommandEmpty className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-2">Không tìm thấy khách hàng.</p>
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
