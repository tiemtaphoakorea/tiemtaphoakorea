import type { AnalyticsInventory } from "@workspace/database/types/admin";
import { formatCurrency } from "@workspace/shared/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { AlertTriangle, Archive, Box, PackageX, TrendingUp } from "lucide-react";

interface InventoryStatsProps {
  data: AnalyticsInventory;
}

export function InventoryStats({ data }: InventoryStatsProps) {
  const potentialProfit = data.totalRetailValue - data.totalCostValue;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
        Báo cáo tồn kho
      </h2>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Giá trị tồn (vốn)
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                <Archive className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{formatCurrency(data.totalCostValue)}</div>
              <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                Tính theo giá nhập
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Giá trị tồn (bán)
              </CardTitle>
              <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg">
                <Box className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{formatCurrency(data.totalRetailValue)}</div>
              <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                Tính theo giá bán
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Lợi nhuận tiềm năng
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(potentialProfit)}
              </div>
              <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                {data.totalUnits.toLocaleString("vi-VN")} đơn vị tồn kho
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Sắp hết hàng
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {data.lowStockCount}
              </div>
              <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                Variant dưới ngưỡng tồn
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-black tracking-wider text-slate-500 uppercase">
                Hết hàng
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <PackageX className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                {data.outOfStockCount}
              </div>
              <p className="mt-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">
                Variant hết hàng
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
