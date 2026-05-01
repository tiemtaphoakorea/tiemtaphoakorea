"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminProfile } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-foreground";

type UserDrawerProps = {
  open: boolean;
  user: AdminProfile | null;
  onClose: () => void;
};

export function UserDrawer({ open, user, onClose }: UserDrawerProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("staff");
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(user?.fullName ?? "");
    setUsername("");
    setPhone("");
    setRole(user?.role ?? "staff");
    setIsActive(true);
  }, [user, open]);

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

  const handleSave = () => {
    if (!fullName.trim()) {
      toast.error("Họ tên bắt buộc");
      return;
    }
    if (user) {
      updateMutation.mutate({
        id: user.id,
        data: { fullName: fullName.trim(), phone: phone.trim() || undefined, role, isActive },
      });
    } else {
      if (!username.trim()) {
        toast.error("Username bắt buộc");
        return;
      }
      createMutation.mutate({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim() || undefined,
        role,
      });
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="border-b border-border px-[22px] py-4">
          <SheetTitle className="text-[15px] font-bold">
            {user ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[22px] py-[22px]">
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Họ và tên</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
            />
          </div>
          {!user && (
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Username (đăng nhập)</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: nguyenvana"
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Số điện thoại</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Vai trò</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
              <span className="text-[13px] font-medium">Đang hoạt động</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
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
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-[22px] py-3.5">
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Đang lưu..." : user ? "Lưu thay đổi" : "Thêm"}
          </Button>
        </div>
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
