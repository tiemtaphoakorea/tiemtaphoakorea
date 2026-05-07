"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminProfile } from "@workspace/database/types/admin";
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
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

type Props = {
  user: AdminProfile;
  onEdit: (user: AdminProfile) => void;
};

export function UserRowActions({ user, onEdit }: Props) {
  const isActive = user.isActive ?? true;
  const queryClient = useQueryClient();
  type ConfirmAction = "lock" | "reset" | null;
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const toggleMutation = useMutation({
    mutationFn: () => adminClient.toggleUserStatus(user.id, !isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success(isActive ? "Đã khóa nhân viên" : "Đã mở khóa nhân viên");
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const resetMutation = useMutation({
    mutationFn: () => adminClient.resetUserPassword(user.id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      const newPassword = res?.newPassword;
      toast.success(
        newPassword ? `Mật khẩu mới: ${newPassword}` : "Đã đặt lại mật khẩu",
        newPassword ? { duration: 15000 } : undefined,
      );
    },
    onError: (e) => toast.error(`Lỗi: ${e instanceof Error ? e.message : String(e)}`),
  });

  const handleToggle = () => {
    if (isActive) {
      setConfirmAction("lock");
    } else {
      toggleMutation.mutate();
    }
  };

  const handleReset = () => {
    setConfirmAction("reset");
  };

  const handleConfirm = () => {
    if (confirmAction === "lock") toggleMutation.mutate();
    else if (confirmAction === "reset") resetMutation.mutate();
    setConfirmAction(null);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md text-xs"
          onClick={() => onEdit(user)}
        >
          Sửa
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md text-xs"
          onClick={handleToggle}
          disabled={toggleMutation.isPending}
        >
          {isActive ? "Khóa" : "Mở khóa"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-md text-xs"
          onClick={handleReset}
          disabled={resetMutation.isPending}
        >
          Đặt lại MK
        </Button>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "lock"
                ? `Khóa tài khoản "${user.fullName ?? "?"}"`
                : `Đặt lại mật khẩu cho "${user.fullName ?? "?"}"`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "lock"
                ? "Nhân viên sẽ không thể đăng nhập sau khi bị khóa."
                : "Mật khẩu mới sẽ được tạo tự động và hiển thị sau khi xác nhận."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Xác nhận</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
