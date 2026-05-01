"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AdminProfile } from "@workspace/database/types/admin";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
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
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import {
  TableEmptyRow,
  TableErrorRow,
  TableLoadingRows,
} from "@/components/admin/shared/data-state";
import { TonePill } from "@/components/admin/shared/status-badge";
import { UserDrawer } from "@/components/admin/shared/user-drawer";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

const PAGE_LIMIT = 25;

const ROLE_LABELS: Record<string, { label: string; tone: "blue" | "indigo" | "amber" | "gray" }> = {
  owner: { label: "Owner", tone: "amber" },
  manager: { label: "Manager", tone: "indigo" },
  staff: { label: "Staff", tone: "blue" },
  customer: { label: "Customer", tone: "gray" },
};

export default function AdminStaff() {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<AdminProfile | null | undefined>(undefined);

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list(debouncedQuery, 1, PAGE_LIMIT),
    queryFn: async () =>
      await adminClient.getUsers({
        search: debouncedQuery || undefined,
        page: 1,
        limit: PAGE_LIMIT,
      }),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  const list: AdminProfile[] = usersQuery.data?.data ?? [];
  const filtered = roleFilter === "all" ? list : list.filter((u) => u.role === roleFilter);
  const total = usersQuery.data?.metadata.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="flex h-[34px] items-center gap-2 rounded-lg border border-border bg-white px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground/60" strokeWidth={2} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhân viên..."
            className="h-auto w-full border-0 bg-transparent px-0 py-0 shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 sm:w-[200px]"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="h-[34px] w-full rounded-lg text-[13px] sm:w-[160px]"
        >
          <SelectOption value="all">Tất cả vai trò</SelectOption>
          <SelectOption value="owner">Owner</SelectOption>
          <SelectOption value="manager">Manager</SelectOption>
          <SelectOption value="staff">Staff</SelectOption>
        </Select>
        <span className="text-xs text-muted-foreground">
          {usersQuery.isLoading ? "Đang tải..." : `${total} người dùng`}
        </span>
        <Button className="h-[34px] gap-1.5 sm:ml-auto" onClick={() => setEditing(null)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          Thêm nhân viên
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {["Nhân viên", "Vai trò", "Email", ""].map((h, i) => (
                  <TableHead
                    key={i}
                    className="px-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading && <TableLoadingRows cols={4} rows={5} />}
              {usersQuery.error && <TableErrorRow cols={4} message={String(usersQuery.error)} />}
              {!usersQuery.isLoading && filtered.length === 0 && (
                <TableEmptyRow cols={4} message="Chưa có nhân viên" />
              )}
              {filtered.map((u) => {
                const role = ROLE_LABELS[u.role] ?? { label: u.role, tone: "gray" as const };
                const initial = u.fullName?.charAt(0) ?? "?";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          // biome-ignore lint/performance/noImgElement: external avatar URL
                          <img
                            src={u.avatarUrl}
                            alt={u.fullName ?? ""}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500 text-[13px] font-bold text-white">
                            {initial}
                          </div>
                        )}
                        <span className="text-[13px] font-semibold">{u.fullName ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <TonePill tone={role.tone}>{role.label}</TonePill>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md text-xs"
                        onClick={() => setEditing(u)}
                      >
                        Sửa
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <UserDrawer
        open={editing !== undefined}
        user={editing ?? null}
        onClose={() => setEditing(undefined)}
      />
    </div>
  );
}
