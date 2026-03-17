import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OrderStatusHistoryProps {
  history: any[];
  statusConfig: any;
  formatDate: (date: any) => string;
}

export function OrderStatusHistory({ history, statusConfig, formatDate }: OrderStatusHistoryProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <Clock className="h-5 w-5 text-slate-500" /> Lịch sử trạng thái
        </CardTitle>
      </CardHeader>
      <CardContent className="relative ml-6 space-y-8 border-l-2 border-slate-100 py-2 pl-6 dark:border-slate-800">
        {history.map((item: any) => (
          <div key={item.id} className="relative">
            <div
              className={`absolute top-1 -left-[31px] h-4 w-4 rounded-full border-2 border-white dark:border-slate-950 ${statusConfig[item.status].color.split(" ")[0]} ${statusConfig[item.status].color.split(" ")[1]}`}
            ></div>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                {statusConfig[item.status].label}
                <span className="ml-auto font-mono text-[10px] font-normal text-slate-400">
                  {formatDate(item.createdAt)}
                </span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                Cập nhật bởi: {item.creator?.fullName || "Admin"}
              </span>
              {item.note && (
                <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600 italic dark:bg-slate-900 dark:text-slate-400">
                  "{item.note}"
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
