import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Mail, Phone, User } from "lucide-react";

interface CustomerProfileHeaderProps {
  customer: any;
}

export function CustomerProfileHeader({ customer }: CustomerProfileHeaderProps) {
  return (
    <Card className="border-none bg-white/80 shadow-xl ring-1 shadow-slate-200/50 ring-slate-200 backdrop-blur-xl">
      <CardContent className="p-8">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center">
          <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
            <AvatarImage src={customer.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/5 text-primary text-4xl font-black italic">
              {customer.fullName
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                {customer.fullName}
              </h1>
              <Badge
                className={`${customer.isActive ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-red-200 bg-red-100 text-red-700"} border px-3 py-1 text-[10px] font-black uppercase`}
              >
                {customer.isActive ? "Đang hoạt động" : "Đã bị khóa"}
              </Badge>
              <Badge
                variant="outline"
                className="border-slate-200 px-3 py-1 text-[10px] font-black uppercase"
              >
                {customer.customerCode}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-3 font-bold text-slate-600">
                <div className="text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] tracking-widest text-slate-400 uppercase">
                    Số điện thoại
                  </span>
                  <span>{customer.phone || "Chưa cập nhật"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-bold text-slate-600">
                <div className="text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] tracking-widest text-slate-400 uppercase">
                    Email hệ thống
                  </span>
                  <span className="text-xs">
                    {(customer.customerCode || "unknown").toLowerCase()}
                    @shop.internal
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 font-bold text-slate-600">
                <div className="text-primary flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] tracking-widest text-slate-400 uppercase">
                    Loại khách
                  </span>
                  <span>{customer.customerType === "retail" ? "Khách lẻ" : "Khách sỉ"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
