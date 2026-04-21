"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG } from "@workspace/shared/constants";
import { PAGINATION_DEFAULT } from "@workspace/shared/pagination";
import {
  type UserEditFormValues,
  type UserFormValues,
  userEditSchema,
  userSchema,
} from "@workspace/shared/schemas";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card";
import { DataTable } from "@workspace/ui/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
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
  Trash2,
  UserPlus,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

// ---------------------------------------------------------------------------
// UI state management
// ---------------------------------------------------------------------------

type UIState = {
  isLoadingAction: boolean;
  isAddSheetOpen: boolean;
  isEditSheetOpen: boolean;
  editingUser: any | null;
  showCredentials: any | null;
  deletingUser: any | null;
};

const initialUIState: UIState = {
  isLoadingAction: false,
  isAddSheetOpen: false,
  isEditSheetOpen: false,
  editingUser: null,
  showCredentials: null,
  deletingUser: null,
};

type UIAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "OPEN_ADD" }
  | { type: "CLOSE_ADD" }
  | { type: "OPEN_EDIT"; payload: any }
  | { type: "CLOSE_EDIT" }
  | { type: "SHOW_CREDENTIALS"; payload: any }
  | { type: "HIDE_CREDENTIALS" }
  | { type: "SET_DELETING"; payload: any | null };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoadingAction: action.payload };
    case "OPEN_ADD":
      return { ...state, isAddSheetOpen: true };
    case "CLOSE_ADD":
      return { ...state, isAddSheetOpen: false };
    case "OPEN_EDIT":
      return { ...state, isEditSheetOpen: true, editingUser: action.payload };
    case "CLOSE_EDIT":
      return { ...state, isEditSheetOpen: false, editingUser: null };
    case "SHOW_CREDENTIALS":
      return { ...state, showCredentials: action.payload };
    case "HIDE_CREDENTIALS":
      return { ...state, showCredentials: null };
    case "SET_DELETING":
      return { ...state, deletingUser: action.payload };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

function getColumns(handlers: {
  onEdit: (user: any) => void;
  onResetPassword: (id: string, username: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (user: any) => void;
}): ColumnDef<any>[] {
  return [
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
                onClick={() => handlers.onEdit(row.original)}
              >
                <Edit2 className="h-4 w-4 shrink-0" /> Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-10 gap-2"
                onClick={() => handlers.onResetPassword(row.original.userId, row.original.username)}
              >
                <Key className="h-4 w-4 text-amber-500" /> Đổi mật khẩu
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() =>
                  handlers.onToggleStatus(row.original.userId, !!row.original.isActive)
                }
              >
                <Ban className="h-4 w-4" /> {row.original.isActive ? "Khóa" : "Mở khóa"} tài khoản
              </DropdownMenuItem>
              <DropdownMenuItem
                className="h-10 gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 dark:focus:bg-red-950/20"
                onClick={() => handlers.onDelete(row.original)}
              >
                <Trash2 className="h-4 w-4" /> Xóa nhân viên
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AddUserSheet({
  open,
  onOpenChange,
  onSubmit,
  isLoadingAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserFormValues) => Promise<void>;
  isLoadingAction: boolean;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    values: { username: "", fullName: "", phone: "", role: "staff" },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 py-8">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label
                htmlFor="add-username"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Tên đăng nhập
              </label>
              <Input
                id="add-username"
                {...form.register("username")}
                placeholder="VD: nv_banhang"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                aria-invalid={!!form.formState.errors.username}
              />
              {form.formState.errors.username && (
                <p className="text-destructive text-sm">{form.formState.errors.username.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <label
                htmlFor="add-fullname"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Họ và tên
              </label>
              <Input
                id="add-fullname"
                {...form.register("fullName")}
                placeholder="Nguyễn Văn A"
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                aria-invalid={!!form.formState.errors.fullName}
              />
              {form.formState.errors.fullName && (
                <p className="text-destructive text-sm">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="add-phone"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Số điện thoại
                </label>
                <Input
                  id="add-phone"
                  {...form.register("phone")}
                  placeholder="09xx xxx xxx"
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="add-role"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Vai trò
                </label>
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="add-role"
                        className="h-11 bg-slate-50/50 dark:bg-slate-900/50"
                      >
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
  );
}

function EditUserSheet({
  open,
  onOpenChange,
  editingUser,
  onSubmit,
  isLoadingAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: any | null;
  onSubmit: (data: UserEditFormValues) => Promise<void>;
  isLoadingAction: boolean;
}) {
  const form = useForm<UserEditFormValues>({
    resolver: zodResolver(userEditSchema),
    values: editingUser
      ? {
          fullName: editingUser.fullName ?? "",
          phone: editingUser.phone ?? "",
          role: editingUser.role ?? "staff",
        }
      : { fullName: "", phone: "", role: "staff" },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b border-slate-100 pb-6 dark:border-slate-800">
          <SheetTitle className="text-2xl font-black">Chỉnh sửa thông tin</SheetTitle>
          <SheetDescription className="font-medium text-slate-500">
            Cập nhật thông tin cho {editingUser?.fullName}.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 py-8">
          <div className="space-y-4">
            <div className="grid gap-2">
              <label
                htmlFor="edit-fullname"
                className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
              >
                Họ và tên
              </label>
              <Input
                id="edit-fullname"
                {...form.register("fullName")}
                className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                aria-invalid={!!form.formState.errors.fullName}
              />
              {form.formState.errors.fullName && (
                <p className="text-destructive text-sm">{form.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label
                  htmlFor="edit-phone"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Số điện thoại
                </label>
                <Input
                  id="edit-phone"
                  {...form.register("phone")}
                  className="h-11 bg-slate-50/50 font-medium dark:bg-slate-900/50"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="edit-role"
                  className="text-sm font-black tracking-wider text-slate-700 uppercase dark:text-slate-300"
                >
                  Vai trò
                </label>
                <Controller
                  name="role"
                  control={form.control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="edit-role"
                        className="h-11 bg-slate-50/50 dark:bg-slate-900/50"
                      >
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
  );
}

function DeleteUserDialog({
  deletingUser,
  onClose,
  onConfirm,
  isLoadingAction,
}: {
  deletingUser: any | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoadingAction: boolean;
}) {
  return (
    <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa nhân viên?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa nhân viên <strong>{deletingUser?.fullName}</strong>? Hành động này
            không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoadingAction}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoadingAction}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoadingAction ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: any | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!credentials} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-[2rem] border-none shadow-2xl sm:max-w-md">
        <DialogHeader className="items-center space-y-4 pt-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black">
            {credentials?.isReset ? "Đã đặt lại mật khẩu!" : "Tạo tài khoản thành công!"}
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            {credentials?.isReset
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
                {credentials?.username}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(credentials?.username);
                  toast.success("Copied!");
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
                {credentials?.password}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(credentials?.password);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div />}>
      <AdminUsersPageContent />
    </Suspense>
  );
}

function AdminUsersPageContent() {
  "use no memo";
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const urlSearchTerm = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(searchParams.get("limit") || String(PAGINATION_DEFAULT.LIMIT), 10),
  );

  // Local search state with debounce so URL updates after user pauses typing.
  const [searchInput, setSearchInput] = useState(urlSearchTerm);
  const [debouncedSearch] = useDebounce(searchInput, 300);

  // Keep local input in sync if URL changes from elsewhere (e.g. back button).
  useEffect(() => {
    setSearchInput(urlSearchTerm);
  }, [urlSearchTerm]);

  // Push debounced search to URL.
  useEffect(() => {
    if (debouncedSearch === urlSearchTerm) return;
    updateParams({ search: debouncedSearch || null, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, urlSearchTerm]);

  const [ui, dispatch] = useReducer(uiReducer, initialUIState);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.users.list(debouncedSearch, page, limit),
    queryFn: () => adminClient.getUsers({ search: debouncedSearch || undefined, page, limit }),
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
    setSearchInput(val);
  };

  const handleAddUser = async (data: UserFormValues) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const payload = {
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      phone: data.phone || undefined,
    };
    let res;

    try {
      res = await adminClient.createUser(payload);
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
      });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    toast.success("Thành công", { description: "Đã tạo nhân viên mới" });
    dispatch({ type: "CLOSE_ADD" });
    dispatch({
      type: "SHOW_CREDENTIALS",
      payload: {
        username: res.profile?.username,
        password: res.password,
        role: res.profile?.role,
      },
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    dispatch({ type: "SET_LOADING", payload: false });
  };

  const handleEditUser = async (data: UserEditFormValues) => {
    const id = ui.editingUser?.userId;
    if (!id) return;
    dispatch({ type: "SET_LOADING", payload: true });
    const payload = {
      fullName: data.fullName,
      phone: data.phone || undefined,
      role: data.role,
    };

    try {
      await adminClient.updateUser(id, payload);
      toast.success("Thành công", { description: "Đã cập nhật thông tin" });
      dispatch({ type: "CLOSE_EDIT" });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const successDescription = currentStatus ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản";

    try {
      await adminClient.toggleUserStatus(id, !currentStatus);
      toast.success("Thành công", {
        description: successDescription,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
      });
    }
  };

  const handleDeleteUser = async () => {
    const id = ui.deletingUser?.userId;
    if (!id) return;
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      await adminClient.deleteUser(id);
      toast.success("Thành công", { description: "Đã xóa nhân viên" });
      dispatch({ type: "SET_DELETING", payload: null });
      await queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      dispatch({ type: "SET_LOADING", payload: false });
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
      });
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    if (!confirm("Bạn có chắc muốn đặt lại mật khẩu cho nhân viên này?")) return;

    try {
      const res = await adminClient.resetUserPassword(id);
      dispatch({
        type: "SHOW_CREDENTIALS",
        payload: {
          username,
          password: res.newPassword,
          isReset: true,
        },
      });
    } catch (err: any) {
      toast.error("Lỗi", {
        description: err?.response?.data?.error ?? err?.message ?? "Có lỗi xảy ra",
      });
    }
  };

  const columns = getColumns({
    onEdit: (user) => dispatch({ type: "OPEN_EDIT", payload: user }),
    onResetPassword: handleResetPassword,
    onToggleStatus: handleToggleStatus,
    onDelete: (user) => dispatch({ type: "SET_DELETING", payload: user }),
  });

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

        <AddUserSheet
          open={ui.isAddSheetOpen}
          onOpenChange={(open) => dispatch({ type: open ? "OPEN_ADD" : "CLOSE_ADD" })}
          onSubmit={handleAddUser}
          isLoadingAction={ui.isLoadingAction}
        />
      </div>

      {/* Main Content Area */}
      <Card className="gap-0 py-0 overflow-hidden border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
        <CardHeader className="border-b border-slate-100 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm nhân viên (tên, tài khoản)..."
                value={searchInput}
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

      <EditUserSheet
        open={ui.isEditSheetOpen}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_EDIT" });
        }}
        editingUser={ui.editingUser}
        onSubmit={handleEditUser}
        isLoadingAction={ui.isLoadingAction}
      />

      <DeleteUserDialog
        deletingUser={ui.deletingUser}
        onClose={() => dispatch({ type: "SET_DELETING", payload: null })}
        onConfirm={handleDeleteUser}
        isLoadingAction={ui.isLoadingAction}
      />

      <CredentialsDialog
        credentials={ui.showCredentials}
        onClose={() => dispatch({ type: "HIDE_CREDENTIALS" })}
      />
    </div>
  );
}
