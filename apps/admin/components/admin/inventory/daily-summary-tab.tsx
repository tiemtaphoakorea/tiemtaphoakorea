"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";

export function InventoryDailySummaryTab() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.admin.inventory.dailySummary({}),
    queryFn: () => adminClient.getInventoryDailySummary(),
    staleTime: 1000 * 60 * 5,
  });

  const rows = data?.data ?? [];

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left">Ngày</th>
            <th className="px-4 py-2 text-right text-green-700">Nhập</th>
            <th className="px-4 py-2 text-right text-red-700">Xuất</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Đang tải...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                Chưa có dữ liệu.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.date} className="border-b">
                <td className="px-4 py-2">{row.date}</td>
                <td className="px-4 py-2 text-right text-green-600 font-medium">
                  +{Number(row.totalIn)}
                </td>
                <td className="px-4 py-2 text-right text-red-600 font-medium">
                  -{Number(row.totalOut)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
