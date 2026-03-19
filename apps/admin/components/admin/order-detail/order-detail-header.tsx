import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ChevronLeft, Clock, Printer } from "lucide-react";
import Link from "next/link";

interface OrderDetailHeaderProps {
  order: any;
  statusConfig: Record<string, { label: string; color: string; icon: any; next?: string[] }>;
  isTerminal: boolean;
  onStatusUpdate: (newStatus: string) => void;
  formatDate: (date: any) => string;
}

export function OrderDetailHeader({
  order,
  statusConfig,
  isTerminal,
  onStatusUpdate,
  formatDate,
}: OrderDetailHeaderProps) {
  const currentStatusConfig = statusConfig[order.status] || statusConfig.pending; // fallback

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/orders">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              #{order.orderNumber}
            </h1>
            <Badge
              className={`${currentStatusConfig.color} flex items-center gap-1 border px-2 py-1 text-xs font-black uppercase`}
            >
              {currentStatusConfig.icon && <currentStatusConfig.icon className="h-3 w-3" />}
              {currentStatusConfig.label}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500">
            <Clock className="h-3 w-3" /> Tạo lúc: {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2 font-bold">
          <Printer className="h-4 w-4" /> In hóa đơn
        </Button>
        {/* Status Actions */}
        {!isTerminal && currentStatusConfig.next && (
          <div className="flex items-center gap-2">
            {currentStatusConfig.next.map((nextStatus) => {
              const nextConfig = statusConfig[nextStatus];
              if (!nextConfig) return null;

              const isDestructive = nextStatus === "cancelled";

              return (
                <Button
                  key={nextStatus}
                  variant={isDestructive ? "destructive" : "default"}
                  className={`font-bold shadow-lg ${
                    !isDestructive ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""
                  }`}
                  onClick={() => onStatusUpdate(nextStatus)}
                >
                  {nextConfig.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
