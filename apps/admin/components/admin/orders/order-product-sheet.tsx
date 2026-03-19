import { formatCurrency } from "@repo/shared/utils";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { Plus, Search } from "lucide-react";

interface OrderProductSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productSearch: string;
  onSearchChange: (search: string) => void;
  filteredProducts: any[];
  onAddItem: (product: any, variant: any) => void;
}

export function OrderProductSheet({
  isOpen,
  onOpenChange,
  productSearch,
  onSearchChange,
  filteredProducts,
  onAddItem,
}: OrderProductSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button className="shadow-primary/20 gap-2 font-bold shadow-lg">
          <Plus className="h-4 w-4" /> Thêm sản phẩm
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 p-6 dark:border-slate-800">
          <SheetTitle>Thêm sản phẩm</SheetTitle>
          <SheetDescription>Tìm kiếm và chọn sản phẩm để thêm vào đơn hàng.</SheetDescription>
          <div className="relative mt-4">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm theo tên hoặc SKU..."
              value={productSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-11 bg-slate-50 pl-9"
            />
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="hover:border-primary/50 rounded-xl border border-slate-200 p-4 transition-colors dark:border-slate-800"
            >
              <div className="mb-3 flex items-start justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white">{product.name}</h4>
                <Badge variant="outline" className="text-[10px]">
                  {product.category?.name}
                </Badge>
              </div>
              <div className="space-y-2">
                {product.variants.map((variant: any) => (
                  <div
                    key={variant.id}
                    className="group flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{variant.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{variant.sku}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-primary text-sm font-bold">
                          {formatCurrency(Number(variant.price))}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Kho: {variant.stockQuantity}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="hover:bg-primary h-8 w-8 rounded-full p-0 hover:text-white"
                        onClick={() => onAddItem(product, variant)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="py-10 text-center text-slate-500">Không tìm thấy sản phẩm nào.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
