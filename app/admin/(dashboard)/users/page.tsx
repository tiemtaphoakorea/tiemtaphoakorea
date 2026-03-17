"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Ban,
  CheckCircle2,
  Copy,
  Edit2,
  Key,
  MoreHorizontal,
  Phone,
  Search,
  Shield,
  UserPlus,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG } from "@/lib/constants";
import { PAGINATION_DEFAULT } from "@/lib/pagination";
import {
  type UserEditFormValues,
  type UserFormValues,
  userEditSchema,
  userSchema,
} from "@/lib/schemas";
import { adminClient } from "@/services/admin.client";

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchTerm = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT.LIMIT), 10),
  );

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showCredentials, setShowCredentials] = useState<any>(null);

  const addForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { username: "", fullName: "", phone: "", role: "staff" },
  });
  const editForm = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: { fullName: "", phone: "", role: "staff" },
  });

  useEffect(() => {
    if (!isAddSheetOpen) addForm.reset({ username: "", fullName: "", phone: "", role: "staff" });
  }, [isAddSheetOpen, addForm]);
  useEffect(() => {
    if (isEditSheetOpen && editingUser) {
      editForm.reset({
        fullName: editingUser.fullName ?? "",
        phone: editingUser.phone ?? "",
        role: editingUser.role ?? "staff",
      });
    }
  }, [isEditSheetOpen, editingUser, editForm]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", searchTerm, page, limit],
    queryFn: () => adminClient.getUsers({ search: searchTerm || undefined, page, limit }),
    placeholderData: keepPreviousData,
  });

  const rawUsers = data?.data || [];
  const metadata = data?.metadata;
  const users = rawUsers.map((u: any) => ({
    ...u,
    userId: u.userId ?? u.id,
  }));

  const updateParams = (newParams: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (newParams.search !== undefined && newParams.page === undefined) {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (val: string) => {
    updateParams({ search: val });
  };

  const handleAddUser = async (data: UserFormValues) => {
    setIsLoadingAction(true);
    try {
      const res = await adminClient.createUser({
        username: data.username,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone || undefined,
      });
      toast({ title: "Thành công", description: "Đã tạo nhân viên mới" });
      setIsAddSheetOpen(false);
      setShowCredentials({
        username: res.profile?.username,
        password: res.password,
        role: res.profile?.role,
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleEditUser = async (data: UserEditFormValues) => {
    const id = editingUser?.userId;
    if (!id) return;
    setIsLoadingAction(true);
    try {
      await adminClient.updateUser(id, {
        fullName: data.fullName,
        phone: data.phone || undefined,
        role: data.role,
      });
      toast({ title: "Thành công", description: "Đã cập nhật thông tin" });
      setIsEditSheetOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminClient.toggleUserStatus(id, !currentStatus);
      toast({
        title: "Thành công",
        description: currentStatus ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    if (!confirm("Bạn có chắc muốn đặt lại mật khẩu cho nhân viên này?")) return;

    try {
      const res = await adminClient.resetUserPassword(id);
      setShowCredentials({
        username,
        password: res.newPassword,
        isReset: true,
      });
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "avatarUrl",
      header: () => <div className="w-[80px] text-center">Avatar</div>,
      cell: ({ row }) => (
        <div className="flex w-[80px] items-center justify-center">
          <Avatar className="h-10 w-10 border border-slate-200 dark:border-slate-800">
            <AvatarImage src={row.original.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold whitespace-nowrap">
              {row.original.fullName
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2) || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Họ và tên",
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-slate-900 dark:text-white">{row.original.fullName}</span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <Shield className="h-3 w-3" /> {row.original.username}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: () => <div className="w-[100px] text-center">Vai trò</div>,
      cell: ({ row }) => {
        const role = row.original.role as string;
        const config = USER_ROLE_CONFIG[role] || USER_ROLE_CONFIG.staff;
        return (
          <div className="flex w-[100px] justify-center">
            <Badge
              className={`${config.color} border text-[10px] font-black tracking-tight uppercase`}
            >
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: () => <div className="w-[120px]">Điện thoại</div>,
      cell: ({ row }) => (
        <div className="flex w-[120px] items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Phone className="h-3 w-3" />
          {row.original.phone || "---"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: () => <div className="w-[120px] text-center">Trạng thái</div>,
      cell: ({ row }) => (
        <div className="flex w-[120px] justify-center">
          <Badge
            className={`${
              row.original.isActive
                ? USER_STATUS_CONFIG.Active.color
                : USER_STATUS_CONFIG.Inactive.color
            } border text-[10px] font-black tracking-tight uppercase`}
          >
            {row.original.isActive
              ? USER_STATUS_CONFIG.Active.label
              : USER_STATUS_CONFIG.Inactive.label}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="w-[50px] text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 rounded-lg p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 font-bold">
              <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
              <DropdownMenuItem
                className="h-10 gap-2"
                onClick={() => {
                  setEditingUser(row.original);
                  setIsEditSheetOpen(true);
                }}
              >
                <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-10 gap-2"
                onClick={() => handleResetPassword(row.original.userId, row.original.username)}
              >
                <Key className="h-4 w-4 text-amber-500" /> Đổi mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() => handleToggleStatus(row.original.userId, !!row.original.isActive)}
              >
                <Ban className="h-4 w-4" /> {row.original.isActive ? "Khóa" : "Mở khóa"} tài khoản
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Quản lý Nhân viên
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Quản lý tài khoản, phân quyền và trạng thái nhân viên hệ thống.
          </p>
        </div>

        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button className="shadow-primary/20 h-11 gap-2 self-start rounded-xl px-6 font-black shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] md:self-auto">
              <UserPlus className="h-5 w-5" />
              Thêm nhân viên
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
            <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
              <SheetTitle className="text-2xl font-black">Thêm nhân viên mới</SheetTitle>
              <SheetDescription className="font-medium text-slate-500">
                Nhập thông tin cơ bản để tạo tài khoản. Hệ thống sẽ tự động tạo mật khẩu.
              </SheetDescription>
            </SheetHeader>
            <form
              onSubmit={addForm.handleSubmit(handleAddUser)}
              className="flex flex-col gap-6 py-8"
            >
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Tên đăng nhập
                  </label>
                  <Input
                    {...addForm.register("username")}
                    placeholder="VD: nv_banhang"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    aria-invalid={!!addForm.formState.errors.username}
                  />
                  {addForm.formState.errors.username && (
                    <p className="text-destructive text-sm">
                      {addForm.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Họ và tên
                  </label>
                  <Input
                    {...addForm.register("fullName")}
                    placeholder="Nguyễn Văn A"
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    aria-invalid={!!addForm.formState.errors.fullName}
                  />
                  {addForm.formState.errors.fullName && (
                    <p className="text-destructive text-sm">
                      {addForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Số điện thoại
                    </label>
                    <Input
                      {...addForm.register("phone")}
                      placeholder="09xx xxx xxx"
                      className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                      Vai trò
                    </label>
                    <Controller
                      name="role"
                      control={addForm.control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-900/50">
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
                <div className="flex w-full items-center justify-end gap-3">
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="h-11 px-6 font-bold">
                      Hủy
                    </Button>
                  </SheetTrigger>
                  <Button
                    type="submit"
                    disabled={isLoadingAction}
                    className="shadow-primary/20 h-11 rounded-xl px-6 font-black shadow-lg"
                  >
                    {isLoadingAction ? "Đang xử lý..." : "Tạo tài khoản"}
                  </Button>
                </div>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm nhân viên (tên, tài khoản)..."
                defaultValue={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            pageCount={metadata?.totalPages ?? 1}
            pagination={{
              pageIndex: page - 1,
              pageSize: limit,
            }}
            onPaginationChange={(p) =>
              updateParams({
                page: p.pageIndex + 1,
                limit: p.pageSize,
              })
            }
            emptyMessage="Không tìm thấy nhân viên nào."
          />
        </CardContent>
      </Card>

      {/* Edit User Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
            <SheetTitle className="text-2xl font-black">Chỉnh sửa thông tin</SheetTitle>
            <SheetDescription className="font-medium text-slate-500">
              Cập nhật thông tin cho {editingUser?.fullName}.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={editForm.handleSubmit(handleEditUser)}
            className="flex flex-col gap-6 py-8"
          >
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                  Họ và tên
                </label>
                <Input
                  {...editForm.register("fullName")}
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  aria-invalid={!!editForm.formState.errors.fullName}
                />
                {editForm.formState.errors.fullName && (
                  <p className="text-destructive text-sm">
                    {editForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Số điện thoại
                  </label>
                  <Input
                    {...editForm.register("phone")}
                    className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300">
                    Vai trò
                  </label>
                  <Controller
                    name="role"
                    control={editForm.control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-900/50">
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>
            <SheetFooter className="border-t border-slate-100 pt-6 dark:border-slate-800">
              <div className="flex w-full items-center justify-end gap-3">
                <SheetTrigger asChild>
                  <Button type="button" variant="outline" className="h-11 px-6 font-bold">
                    Hủy
                  </Button>
                </SheetTrigger>
                <Button
                  type="submit"
                  disabled={isLoadingAction}
                  className="shadow-primary/20 h-11 rounded-xl px-6 font-black shadow-lg"
                >
                  {isLoadingAction ? "Đang cập nhật..." : "Lưu thay đổi"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* Credentials Dialog */}
      <Dialog open={!!showCredentials} onOpenChange={() => setShowCredentials(null)}>
        <DialogContent className="rounded-[2rem] border-none shadow-2xl sm:max-w-md">
          <DialogHeader className="items-center space-y-4 pt-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black">
              {showCredentials?.isReset ? "Đã đặt lại mật khẩu!" : "Tạo tài khoản thành công!"}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              {showCredentials?.isReset
                ? "Vui lòng sao chép và gửi mật khẩu mới này cho nhân viên. Đây là lần duy nhất bạn có thể thấy mật khẩu này."
                : "Vui lòng sao chép và gửi thông tin đăng nhập này cho nhân viên. Đây là lần duy nhất bạn có thể thấy mật khẩu này."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Tên đăng nhập
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-black text-slate-900 dark:text-white">
                  {showCredentials?.username}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(showCredentials?.username);
                    toast({ title: "Copied!", duration: 1000 });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                Mật khẩu
              </p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-lg font-black text-slate-900 dark:text-white">
                  {showCredentials?.password}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(showCredentials?.password);
                    toast({ title: "Copied!", duration: 1000 });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
