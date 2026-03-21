import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Clock, ShieldCheck } from "lucide-react";

interface CustomerSecurityCardProps {
  createdAt: any;
  lastActive: any;
  formatDate: (date: any) => string;
}

export function CustomerSecurityCard({
  createdAt,
  lastActive,
  formatDate,
}: CustomerSecurityCardProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          Bảo mật tài khoản
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-500">Ngày tạo tài khoản</span>
          <span className="text-sm font-black tracking-tight">{formatDate(createdAt)}</span>
        </div>
        <div className="flex items-center justify-between border-b border-slate-100 py-2 dark:border-slate-800">
          <span className="text-sm font-bold text-slate-500">Lần cuối hoạt động</span>
          <span className="flex items-center gap-1 text-sm font-black tracking-tight">
            <Clock className="h-3 w-3" /> {formatDate(lastActive)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
