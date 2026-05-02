import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Edit, MoreHorizontal, Package, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";

interface ProductTableProps {
  products: any[];
  categories: any[];
  searchTerm: string;
  currentCategoryId: string;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onEdit: (product: any) => void;
  onDelete?: (id: string) => void;
}

export function ProductTable({
  products,
  categories,
  searchTerm,
  currentCategoryId,
  onSearchChange,
  onCategoryChange,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-t-xl border-b border-slate-100 bg-slate-50/50 p-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm..."
              className="border-slate-200 bg-white pl-9"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select
            value={currentCategoryId}
            onValueChange={onCategoryChange}
            className="w-full md:w-[200px]"
            placeholder="Danh mục"
          >
            <SelectOption value="All">Tất cả danh mục</SelectOption>
            {categories.map((c) => (
              <SelectOption key={c.id} value={c.id}>
                {c.name}
              </SelectOption>
            ))}
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table className="table-fixed min-w-[640px]">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-0 w-[42%]">Sản phẩm</TableHead>
                <TableHead className="min-w-0">Danh mục</TableHead>
                <TableHead className="text-right">Giá bán</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                    <Package className="mx-auto mb-3 h-12 w-12 text-slate-300 opacity-50" />
                    Không tìm thấy sản phẩm nào.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const totalStock =
                    product.variants?.reduce(
                      (acc: number, v: any) => acc + (Number(v.onHand) || 0),
                      0,
                    ) || 0;

                  // Calculate price range correctly
                  const prices = product.variants?.map((v: any) => Number(v.price)) || [];
                  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                  const priceDisplay =
                    minPrice === maxPrice
                      ? formatCurrency(minPrice)
                      : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="min-w-0 whitespace-normal">
                        <div className="flex min-w-0 items-center gap-3">
                          {product.imageUrl ? (
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200">
                              <Package className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-bold text-slate-900" title={product.name}>
                              {product.name}
                            </div>
                            {/* <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0 whitespace-normal">
                        <div className="min-w-0 max-w-[12rem] lg:max-w-[16rem]">
                          <Badge
                            variant="secondary"
                            className="max-w-full bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                          >
                            <span className="block truncate">
                              {product.category?.name || "Chưa phân loại"}
                            </span>
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {priceDisplay}
                      </TableCell>
                      <TableCell className="text-center">
                        {totalStock === 0 ? (
                          <Badge
                            variant="destructive"
                            className="px-2 py-0.5 text-[10px] font-black uppercase"
                          >
                            Hết hàng
                          </Badge>
                        ) : (
                          <span
                            className={`font-bold ${
                              totalStock <= 10 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {totalStock}
                            {totalStock <= 5 && totalStock > 0 && (
                              <span className="ml-2 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                                Sắp hết
                              </span>
                            )}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onEdit(product)}
                              className="cursor-pointer font-medium"
                            >
                              <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeleteTarget({ id: product.id, name: product.name })
                              }
                              className="text-destructive focus:text-destructive cursor-pointer font-medium"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Xóa sản phẩm
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Xóa sản phẩm "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        onConfirm={() => {
          if (deleteTarget) onDelete?.(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </Card>
  );
}
