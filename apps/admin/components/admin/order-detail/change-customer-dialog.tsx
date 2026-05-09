"use client";

import { useQuery } from "@tanstack/react-query";
import type { CustomerStatsItem } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { Check, Loader2, MapPin, Phone, User } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

interface ChangeCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCustomerId: string;
  onConfirm: (newCustomerId: string) => Promise<void>;
}

export function ChangeCustomerDialog({
  open,
  onOpenChange,
  currentCustomerId,
  onConfirm,
}: ChangeCustomerDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CustomerStatsItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debouncedSearch] = useDebounce(search, 300);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.customers.search(debouncedSearch),
    queryFn: () => adminClient.getCustomers({ search: debouncedSearch, limit: 10 }),
    enabled: open,
  });

  const customers: CustomerStatsItem[] = (data?.data ?? []).filter(
    (c: CustomerStatsItem) => c.id !== currentCustomerId,
  );

  const handleClose = () => {
    setSearch("");
    setSelected(null);
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selected.id);
      setSearch("");
      setSelected(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi khách hàng</DialogTitle>
          <DialogDescription>
            Tìm và chọn khách hàng mới. Chỉ áp dụng khi đơn chưa thanh toán.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Command shouldFilter={false} className="rounded-lg border shadow-sm">
            <CommandInput
              placeholder="Tìm theo tên hoặc SĐT..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-52">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tìm kiếm...
                </div>
              )}
              {!isLoading && customers.length === 0 && (
                <CommandEmpty>Không tìm thấy khách hàng.</CommandEmpty>
              )}
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => setSelected(customer)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        selected?.id === customer.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">{customer.fullName}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {customer.phone || "Không có SĐT"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {selected && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Đã chọn
              </p>
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="truncate font-semibold">{selected.fullName}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{selected.phone || "Không có SĐT"}</span>
                  </div>
                  {selected.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{selected.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
