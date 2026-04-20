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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Edit, Filter, MoreHorizontal, Package, Search, Trash2 } from "lucide-react";
import Image from "next/image";

interface ProductTableProps {
  products: any[];
  categories: any[];
  searchTerm: string;
  currentCategoryId: string;
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onEdit: (product: any) => void;
}

export function ProductTable({
  products,
  categories,
  searchTerm,
  currentCategoryId,
  onSearchChange,
  onCategoryChange,
  onEdit,
}: ProductTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleDelete = (e: React.FormEvent<HTMLFormElement>, id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      e.preventDefault();
    }
  };

  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-t-xl border-b border-slate-100 bg-slate-50/50 p-4 md:flex-row dark:border-slate-800 dark:bg-slate-900/50">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm theo tên sản phẩm..."
              className="border-slate-200 bg-white pl-9 dark:border-slate-800 dark:bg-slate-900"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select value={currentCategoryId} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full border-slate-200 bg-white md:w-[200px] dark:border-slate-800 dark:bg-slate-900">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả danh mục</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:ring-slate-800">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:ring-slate-800">
                            <Package className="h-5 w-5 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {product.name}
                          </div>
                          {/* <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div> */}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                      >
                        {product.category?.name || "Chưa phân loại"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
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
                          <DropdownMenuItem asChild>
                            <form
                              method="post"
                              onSubmit={(e) => handleDelete(e, product.id)}
                              className="w-full"
                            >
                              <input type="hidden" name="intent" value="delete" />
                              <input type="hidden" name="id" value={product.id} />
                              <button
                                type="submit"
                                className="text-destructive focus:text-destructive flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 font-medium"
                              >
                                <Trash2 className="mr-2" /> Xóa sản phẩm
                              </button>
                            </form>
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
      </CardContent>
    </Card>
  );
}
