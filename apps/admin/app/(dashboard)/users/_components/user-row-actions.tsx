"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AdminProfile } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
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
    if (isActive && !window.confirm(`Khóa tài khoản "${user.fullName ?? "?"}"?`)) return;
    toggleMutation.mutate();
  };

  const handleReset = () => {
    if (!window.confirm(`Đặt lại mật khẩu cho "${user.fullName ?? "?"}"?`)) return;
    resetMutation.mutate();
  };

  return (
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
  );
}
