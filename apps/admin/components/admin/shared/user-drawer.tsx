"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminProfile } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

// Single schema covering both create and edit modes.
// Username is optional here; create mode enforces it at submit time.
const formSchema = z.object({
  fullName: z.string().min(1, "Họ tên bắt buộc"),
  username: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["owner", "manager", "staff"]),
  isActive: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type UserDrawerProps = {
  open: boolean;
  user: AdminProfile | null;
  onClose: () => void;
};

export function UserDrawer({ open, user, onClose }: UserDrawerProps) {
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      username: "",
      phone: "",
      role: "staff",
      isActive: true,
    },
  });

  // Reset form fields whenever the drawer opens or the target user changes
  useEffect(() => {
    if (!open) return;
    reset({
      fullName: user?.fullName ?? "",
      username: "",
      phone: "",
      role: (user?.role as FormValues["role"]) ?? "staff",
      isActive: true,
    });
  }, [user, open, reset]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all });

  const createMutation = useMutation({
    mutationFn: (data: { fullName: string; username: string; phone?: string; role: string }) =>
      adminClient.createUser(data),
    onSuccess: () => {
      toast.success("Đã thêm nhân viên");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { fullName?: string; phone?: string; role?: string; isActive?: boolean };
    }) => adminClient.updateUser(id, data),
    onSuccess: () => {
      toast.success("Đã cập nhật");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminClient.deleteUser(id),
    onSuccess: () => {
      toast.success("Đã xoá nhân viên");
      invalidate();
      onClose();
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const onFormSubmit = (values: FormValues) => {
    if (user) {
      updateMutation.mutate({
        id: user.id,
        data: {
          fullName: values.fullName.trim(),
          phone: values.phone?.trim() || undefined,
          role: values.role,
          isActive: values.isActive,
        },
      });
    } else {
      // Username is required for create mode
      if (!values.username?.trim()) {
        toast.error("Username bắt buộc");
        return;
      }
      createMutation.mutate({
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        phone: values.phone?.trim() || undefined,
        role: values.role,
      });
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-120">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-sm font-bold">
            {user ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
            <FieldGroup>
              <Field>
                <FieldLabel required>Họ và tên</FieldLabel>
                <Input
                  {...register("fullName")}
                  placeholder="VD: Nguyễn Văn A"
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </Field>

              {!user && (
                <Field>
                  <FieldLabel required>Username (đăng nhập)</FieldLabel>
                  <Input
                    {...register("username")}
                    placeholder="vd: nguyenvana"
                    aria-invalid={!!errors.username}
                  />
                  {errors.username && (
                    <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
                  )}
                </Field>
              )}

              <Field>
                <FieldLabel>Số điện thoại</FieldLabel>
                <Input {...register("phone")} />
              </Field>

              <Field>
                <FieldLabel>Vai trò</FieldLabel>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} className="w-full">
                      <SelectOption value="owner">Owner</SelectOption>
                      <SelectOption value="manager">Manager</SelectOption>
                      <SelectOption value="staff">Staff</SelectOption>
                    </Select>
                  )}
                />
              </Field>

              {user && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                  <span className="text-sm font-medium">Đang hoạt động</span>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              )}

              {user && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="self-start border-red-200 bg-red-100 text-red-600 hover:bg-red-200"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Xoá nhân viên
                </Button>
              )}
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-3.5">
            <Button type="button" variant="outline" onClick={onClose}>
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang lưu..." : user ? "Lưu thay đổi" : "Thêm"}
            </Button>
          </div>
        </form>
      </SheetContent>

      {user && (
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={`Xoá nhân viên "${user.fullName}"?`}
          confirmLabel="Xoá"
          onConfirm={() => {
            deleteMutation.mutate(user.id);
            setShowDeleteConfirm(false);
          }}
        />
      )}
    </Sheet>
  );
}
