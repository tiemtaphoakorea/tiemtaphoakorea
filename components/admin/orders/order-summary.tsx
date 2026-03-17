import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSummaryProps {
  subtotal: number;
  total: number;
  items: any[];
  selectedCustomer: string;
  isSubmitting: boolean;
  error?: string | null;
  onSubmit: () => void;
  formatCurrency: (val: number) => string;
}

export function OrderSummary({
  subtotal,
  total,
  items,
  selectedCustomer,
  isSubmitting,
  error,
  onSubmit,
  formatCurrency,
}: OrderSummaryProps) {
  return (
    <div className="ml-auto flex max-w-xs flex-col gap-4">
      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
        <span>Tạm tính:</span>
        <span>{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-lg font-black text-slate-900 dark:text-white">
        <span>Tổng tiền:</span>
        <span className="text-primary">{formatCurrency(total)}</span>
      </div>
      <Button
        size="lg"
        className="shadow-primary/20 w-full font-bold shadow-xl"
        disabled={items.length === 0 || !selectedCustomer || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          "Đang xử lý..."
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Hoàn tất đơn hàng
          </>
        )}
      </Button>
      {error && <p className="text-center text-xs font-bold text-red-500">{error}</p>}
    </div>
  );
}
