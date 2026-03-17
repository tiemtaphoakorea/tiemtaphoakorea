import { Calendar, Package, Phone, User, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CustomerInfoSheetProps {
  room: any;
  customerStats: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerInfoSheet({
  room,
  customerStats,
  isOpen,
  onOpenChange,
}: CustomerInfoSheetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Thông tin khách hàng</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">Mã khách hàng</p>
                <p className="font-medium">{room.customer.customerCode}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">Họ tên</p>
                <p className="font-medium">{room.customer.fullName || "—"}</p>
              </div>
            </div>
            {room.customer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-muted-foreground text-sm">SĐT</p>
                  <p className="font-medium">{room.customer.phone}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-medium">Thống kê</h4>
            <div className="flex items-center gap-3">
              <Package className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">Tổng đơn</p>
                <p className="font-medium">{customerStats.totalOrders}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Wallet className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-muted-foreground text-sm">Tổng chi tiêu</p>
                <p className="font-medium">{formatCurrency(customerStats.totalSpent)}</p>
              </div>
            </div>
            {customerStats.lastOrderDate && (
              <div className="flex items-center gap-3">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <div>
                  <p className="text-muted-foreground text-sm">Đơn gần nhất</p>
                  <p className="font-medium">
                    {new Date(customerStats.lastOrderDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Link href={`/admin/customers/${room.customerId}`}>
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                Xem chi tiết khách hàng
              </Button>
            </Link>
            <Link href={`/admin/orders/new?customerId=${room.customerId}`}>
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Tạo đơn hàng mới
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
