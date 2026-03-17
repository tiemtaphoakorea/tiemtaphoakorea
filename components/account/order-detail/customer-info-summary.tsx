import { MapPin, Phone, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CustomerInfoSummaryProps {
  order: any;
}

export function CustomerInfoSummary({ order }: CustomerInfoSummaryProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
        <CardHeader>
          <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
            Thông tin khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <User className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {order.customer.fullName}
              </span>
              <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800">
                {order.customer.customerCode || "GUEST"}
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Phone className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Số điện thoại
              </span>
              <span className="text-sm text-slate-500">
                {order.customer.phone || order.shippingPhone || "N/A"}
              </span>
            </div>
          </div>
          <Separator />
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <MapPin className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Địa chỉ giao hàng
              </span>
              <span className="text-sm text-slate-500">
                {order.shippingAddress || order.customer.address || "N/A"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {order.adminNote && (
        <Card className="border-none bg-amber-50/50 shadow-sm ring-1 ring-amber-100">
          <CardHeader>
            <CardTitle className="text-sm font-black tracking-wider text-amber-600 uppercase">
              Ghi chú từ admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-amber-700">{order.adminNote}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
