"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type SupplierFormValues, supplierSchema } from "@repo/shared/schemas";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader } from "@repo/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Textarea } from "@repo/ui/components/textarea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Mail, MoreHorizontal, Phone, Plus, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { adminClient } from "@/services/admin.client";

export default function AdminSuppliers() {
  return (
    <Suspense fallback={<div />}>
      <AdminSuppliersContent />
    </Suspense>
  );
}

function AdminSuppliersContent() {
  "use no memo";
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchTerm = searchParams.get("search") || "";

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      paymentTerms: "",
      note: "",
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", searchTerm],
    queryFn: () => adminClient.getSuppliers({ search: searchTerm }),
  });
  const suppliers = data?.suppliers || [];

  const handleSearch = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set("search", val);
    else params.delete("search");
    router.push(`${pathname}?${params.toString()}`);
  };

  const openAdd = () => {
    setFormMode("add");
    setEditingSupplier(null);
    form.reset({ name: "", phone: "", email: "", address: "", paymentTerms: "", note: "" });
    setIsSheetOpen(true);
  };

  const openEdit = (supplier: any) => {
    setFormMode("edit");
    setEditingSupplier(supplier);
    form.reset({
      name: supplier.name ?? "",
      phone: supplier.phone ?? "",
      email: supplier.email ?? "",
      address: supplier.address ?? "",
      paymentTerms: supplier.paymentTerms ?? "",
      note: supplier.note ?? "",
    });
    setIsSheetOpen(true);
  };

  const handleDelete = async (supplier: any) => {
    if (confirm(`Bạn có chắc muốn xóa nhà cung cấp "${supplier.name}"?`)) {
      try {
        await adminClient.deleteSupplier(supplier.id);
        await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      } catch (error: any) {
        alert(error.message || "Failed to delete");
      }
    }
  };

  const handleSubmit = async (data: SupplierFormValues) => {
    setIsSubmitting(true);
    const payload = {
      name: data.name,
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      paymentTerms: data.paymentTerms ?? "",
      note: data.note ?? "",
      isActive: editingSupplier ? editingSupplier.isActive : true,
    };
    try {
      if (formMode === "add") {
        await adminClient.createSupplier(payload);
      } else {
        if (!editingSupplier) return;
        await adminClient.updateSupplier(editingSupplier.id, payload);
      }
      setIsSheetOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setIsSubmitting(false);
    } catch (error: any) {
      alert(error.message || "Action failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Nhà cung cấp
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Quản lý thông tin các nhà cung cấp sản phẩm.
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="shadow-primary/20 h-11 gap-2 rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" />
          Thêm nhà cung cấp
        </Button>
      </div>

      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10 border-none bg-slate-50/50 pl-10 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:ring-slate-800"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Tên nhà cung cấp
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Liên hệ
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Địa chỉ
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Đơn hàng
                </TableHead>
                <TableHead className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Trạng thái
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center font-medium text-slate-500">
                    Đang tải danh sách...
                  </TableCell>
                </TableRow>
              ) : suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <TableRow
                    key={supplier.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {supplier.name}
                        </span>
                        <span className="font-mono text-xs text-slate-400">{supplier.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {supplier.phone && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Phone className="h-3 w-3" />
                            {supplier.phone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 max-w-[200px] text-sm text-slate-600 dark:text-slate-400">
                        {supplier.address || "---"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono">
                        {supplier.totalOrders || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.isActive ? "outline" : "destructive"}
                        className="text-[10px]"
                      >
                        {supplier.isActive ? "Hoạt động" : "Ngừng HĐ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 rounded-lg p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 font-bold">
                          <DropdownMenuItem onClick={() => openEdit(supplier)} className="gap-2">
                            <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(supplier)}
                            className="gap-2 text-red-500 focus:bg-red-50 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 shrink-0 text-red-500" /> Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center font-medium text-slate-500">
                    Chưa có nhà cung cấp nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
            <SheetTitle className="text-2xl font-black">
              {formMode === "add" ? "Thêm nhà cung cấp" : "Chỉnh sửa nhà cung cấp"}
            </SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              {formMode === "add"
                ? "Tạo nhà cung cấp mới để quản lý nhập hàng."
                : `Cập nhật thông tin cho "${editingSupplier?.name}".`}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-6 py-8">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label
                  htmlFor="supplier-name"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Tên nhà cung cấp <span className="text-red-500">*</span>
                </label>
                <Input
                  id="supplier-name"
                  {...form.register("name")}
                  placeholder="Công ty TNHH ABC..."
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  aria-invalid={!!form.formState.errors.name}
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label
                    htmlFor="supplier-phone"
                    className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                  >
                    Số điện thoại
                  </label>
                  <Input
                    id="supplier-phone"
                    {...form.register("phone")}
                    placeholder="09xxx..."
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label
                    htmlFor="supplier-email"
                    className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                  >
                    Email
                  </label>
                  <Input
                    id="supplier-email"
                    {...form.register("email")}
                    type="email"
                    placeholder="contact@abc.com"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    aria-invalid={!!form.formState.errors.email}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="supplier-address"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Địa chỉ
                </label>
                <Input
                  id="supplier-address"
                  {...form.register("address")}
                  placeholder="Số 123, Đường ABC..."
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="supplier-payment-terms"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Điều khoản thanh toán
                </label>
                <Input
                  id="supplier-payment-terms"
                  {...form.register("paymentTerms")}
                  placeholder="Ví dụ: Net 30, Thanh toán ngay..."
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="supplier-note"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Ghi chú
                </label>
                <Textarea
                  id="supplier-note"
                  {...form.register("note")}
                  placeholder="Thông tin thêm..."
                  className="min-h-[100px] resize-y bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
            </div>

            <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="shadow-primary/20 h-11 w-full rounded-xl font-black shadow-lg"
              >
                {isSubmitting
                  ? "Đang lưu..."
                  : formMode === "add"
                    ? "Tạo nhà cung cấp"
                    : "Lưu thay đổi"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
