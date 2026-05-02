import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";

interface InventoryHeaderProps {
  onAddClick: () => void;
}

export function InventoryHeader({ onAddClick }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Quản lý kho</h1>
        <p className="mt-1 font-medium text-slate-500">
          Đơn nhập hàng và lịch sử biến động tồn kho
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={onAddClick}
          className="shadow-primary/20 h-11 gap-2 rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Tạo đơn nhập
        </Button>
      </div>
    </div>
  );
}
