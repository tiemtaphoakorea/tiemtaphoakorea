import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@workspace/shared/utils";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { NumberInput } from "@workspace/ui/components/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Image as ImageIcon } from "lucide-react";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const MOVEMENT_LABELS: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  stock_out: { label: "Xuất kho", variant: "destructive" },
  supplier_receipt: { label: "Nhập hàng", variant: "default" },
  manual_adjustment: { label: "Điều chỉnh", variant: "secondary" },
  cancellation: { label: "Hoàn hàng", variant: "outline" },
};

interface ProductEditSheetProps {
  categories: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: any;
}

export function ProductEditSheet({
  categories,
  isOpen,
  onOpenChange,
  editingProduct,
}: ProductEditSheetProps) {
  const variantId: string | undefined = editingProduct?.variants[0]?.id;

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: queryKeys.admin.inventory.movements({ variantId, limit: 10, page: 1 }),
    queryFn: () => adminClient.getInventoryMovements({ variantId, limit: 10, page: 1 }),
    enabled: !!variantId,
    staleTime: 1000 * 60,
  });

  const movements = movementsData?.data ?? [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-6 sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa sản phẩm</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin chi tiết cho sản phẩm {editingProduct?.name}.
          </SheetDescription>
        </SheetHeader>
        {editingProduct && (
          <form method="post" encType="multipart/form-data">
            <Input type="hidden" name="intent" value="edit" />
            <Input type="hidden" name="id" value={editingProduct.id} />
            <div className="flex flex-col gap-6 py-8">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-product-name">Tên sản phẩm</Label>
                  <Input
                    id="edit-product-name"
                    name="name"
                    defaultValue={editingProduct.name}
                    placeholder="Ví dụ: Serum dưỡng da..."
                    className="h-11 bg-slate-50/50 font-medium"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-product-category">Danh mục</Label>
                  <Select name="categoryId" defaultValue={editingProduct.categoryId} required>
                    <SelectTrigger
                      id="edit-product-category"
                      className="h-11 w-full bg-slate-50/50 font-medium"
                    >
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-product-price">Giá bán (VNĐ)</Label>
                    <NumberInput
                      id="edit-product-price"
                      name="price"
                      defaultValue={editingProduct.variants[0]?.price}
                      placeholder="0"
                      className="h-11 bg-slate-50/50 font-medium"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-product-cost-price">Giá vốn (VNĐ)</Label>
                    <NumberInput
                      id="edit-product-cost-price"
                      name="costPrice"
                      defaultValue={editingProduct.variants[0]?.costPrice}
                      placeholder="0"
                      className="h-11 bg-slate-50/50 font-medium"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-product-stock">Số lượng tồn kho</Label>
                  <NumberInput
                    id="edit-product-stock"
                    name="stock"
                    defaultValue={editingProduct.variants[0]?.onHand}
                    placeholder="0"
                    decimalScale={0}
                    className="h-11 bg-slate-50/50 font-medium"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-product-description">Mô tả sản phẩm</Label>
                  <textarea
                    id="edit-product-description"
                    name="description"
                    defaultValue={editingProduct.description || ""}
                    className="focus-visible:ring-primary flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Mô tả chi tiết về công dụng, thành phần..."
                  />
                </div>

                {editingProduct.variants[0]?.costHistory?.length > 0 && (
                  <div className="space-y-3">
                    <Label htmlFor="cost-history-table">Lịch sử giá vốn</Label>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <Table id="cost-history-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ngày</TableHead>
                            <TableHead>Giá vốn</TableHead>
                            <TableHead>Ghi chú</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {editingProduct.variants[0].costHistory.map((history: any) => (
                            <TableRow key={history.id}>
                              <TableCell className="py-3 text-xs font-medium">
                                {new Date(history.effectiveDate).toLocaleDateString("vi-VN")}
                              </TableCell>
                              <TableCell className="py-3 text-xs font-black text-slate-900">
                                {formatCurrency(Number(history.costPrice))}
                              </TableCell>
                              <TableCell className="py-3 text-xs font-medium text-slate-500">
                                {history.note || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Lịch sử kho</h3>
                  {movementsLoading ? (
                    <p className="text-xs text-muted-foreground">Đang tải...</p>
                  ) : movements.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Chưa có giao dịch nào.</p>
                  ) : (
                    <div className="space-y-1">
                      {movements.map((m) => {
                        const cfg = MOVEMENT_LABELS[m.type];
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between text-xs py-1 border-b last:border-0"
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={cfg?.variant ?? "secondary"}
                                className="text-[10px] px-1 py-0"
                              >
                                {cfg?.label ?? m.type}
                              </Badge>
                              <span className="text-muted-foreground">
                                {new Date(m.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <span
                              className={
                                m.quantity > 0
                                  ? "text-green-600 font-medium"
                                  : "text-red-600 font-medium"
                              }
                            >
                              {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="grid gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-product-image-file">
                      <ImageIcon className="h-4 w-4" />
                      Tải ảnh mới (Tùy chọn)
                    </Label>
                    <Input
                      id="edit-product-image-file"
                      name="imageFile"
                      type="file"
                      accept="image/*"
                      className="h-11 border-none bg-white font-medium shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-50 px-2 font-bold text-slate-500">
                        Hoặc dùng URL mới
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Input
                      name="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      className="h-11 border-none bg-white font-medium shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter className="border-t border-slate-100 pt-6">
              <div className="flex w-full items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-11 border-slate-200 px-6 font-bold"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="shadow-primary/20 h-11 px-6 font-bold shadow-lg"
                  onClick={() => setTimeout(() => onOpenChange(false), 500)}
                >
                  Cập nhật sản phẩm
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
