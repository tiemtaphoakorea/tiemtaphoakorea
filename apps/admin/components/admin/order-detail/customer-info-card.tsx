import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { MapPin, Phone, User } from "lucide-react";

interface CustomerInfoCardProps {
  customer: any;
  adminNote?: string | null;
}

export function CustomerInfoCard({ customer, adminNote }: CustomerInfoCardProps) {
  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 dark:shadow-none dark:ring-slate-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <User className="text-primary h-5 w-5" /> Khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={customer.avatarUrl || undefined} />
            <AvatarFallback>{customer.fullName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-black text-slate-900 dark:text-white">{customer.fullName}</div>
            <div className="text-xs font-bold text-slate-500 uppercase">
              {customer.customerCode}
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
            <span>{customer.phone || "Không có SĐT"}</span>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
            <span>{customer.address || "Không có địa chỉ"}</span>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
          <p className="text-xs font-black tracking-wider text-slate-400 uppercase">
            Ghi chú admin
          </p>
          <p className="text-sm text-slate-600 italic">{adminNote || "Không có ghi chú"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
