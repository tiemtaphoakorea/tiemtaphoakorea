import { ACCOUNT_ROUTES } from "@workspace/shared/routes";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";

interface CustomerOrderHeaderProps {
  order: any;
  statusInfo: any;
  formatDate: (date: any) => string;
}

export function CustomerOrderHeader({ order, statusInfo, formatDate }: CustomerOrderHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          asChild
          className="h-10 w-10 rounded-xl border-slate-200"
        >
          <Link href={ACCOUNT_ROUTES.ORDERS}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Đơn hàng #{order.orderNumber}
            </h1>
            <Badge
              className={`${statusInfo.color} h-7 border px-3 text-xs font-black tracking-wider uppercase`}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Ngày đặt: {formatDate(order.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
