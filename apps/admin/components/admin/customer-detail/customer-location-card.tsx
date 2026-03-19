import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { MapPin } from "lucide-react";

interface CustomerLocationCardProps {
  address: string | null;
}

export function CustomerLocationCard({ address }: CustomerLocationCardProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <MapPin className="text-primary h-5 w-5" />
          Địa chỉ giao hàng
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-bold text-slate-600 italic dark:text-slate-400">
          {address || "Khách hàng chưa cung cấp địa chỉ giao hàng cố định."}
        </p>
      </CardContent>
    </Card>
  );
}
