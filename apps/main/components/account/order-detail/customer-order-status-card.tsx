import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";

interface CustomerOrderStatusCardProps {
  order: any;
  statusInfo: any;
  statusConfig: any;
  formatDate: (date: any) => string;
}

export function CustomerOrderStatusCard({
  order,
  statusInfo,
  statusConfig,
  formatDate,
}: CustomerOrderStatusCardProps) {
  return (
    <Card className="border-none bg-gradient-to-br from-white to-slate-50 shadow-sm ring-1 ring-slate-200 dark:from-slate-900 dark:to-slate-950 dark:ring-slate-800">
      <CardHeader className="flex flex-row items-center gap-4 pb-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${statusInfo.color.replace("text-", "bg-").split(" ")[0]} bg-opacity-20`}
        >
          <statusInfo.icon className={`h-6 w-6 ${statusInfo.color.split(" ")[1]}`} />
        </div>
        <div>
          <CardTitle className="text-lg font-bold">{statusInfo.label}</CardTitle>
          <CardDescription className="mt-1 font-medium">{statusInfo.description}</CardDescription>
        </div>
      </CardHeader>
      {order.statusHistory && order.statusHistory.length > 0 && (
        <CardContent className="pb-6">
          <Separator className="mb-4" />
          <div className="flex flex-col gap-4">
            {order.statusHistory.map((history: any, index: number) => (
              <div key={history.id} className="relative flex gap-4">
                {/* Line connecting dots */}
                {index !== order.statusHistory.length - 1 && (
                  <div className="absolute top-6 bottom-[-20px] left-[7px] w-0.5 bg-slate-200 dark:bg-slate-800" />
                )}
                <div className="bg-primary z-10 mt-1 h-4 w-4 flex-shrink-0 rounded-full ring-4 ring-white dark:ring-slate-950" />
                <div className="flex flex-col gap-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {statusConfig[history.status]?.label || history.status}
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {formatDate(history.createdAt)}
                    </span>
                  </div>
                  {history.note && <p className="text-sm text-slate-500">{history.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
