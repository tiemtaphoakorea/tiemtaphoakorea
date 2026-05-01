import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { User } from "lucide-react";

interface OrderCustomerCardProps {
  customers: any[];
  selectedCustomerId: string;
  onCustomerChange: (id: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
}

export function OrderCustomerCard({
  customers,
  selectedCustomerId,
  onCustomerChange,
  note,
  onNoteChange,
}: OrderCustomerCardProps) {
  const selectedCustomerData = customers.find((c) => c.id === selectedCustomerId);

  return (
    <Card className="border-none shadow-xl ring-1 shadow-slate-200/50 ring-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-black tracking-tight uppercase">
          <User className="text-primary h-5 w-5" />
          Thông tin khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="order-customer-select">Chọn khách hàng</Label>
          <Select value={selectedCustomerId} onValueChange={onCustomerChange}>
            <SelectTrigger id="order-customer-select" className="h-12 bg-slate-50 font-medium">
              <SelectValue placeholder="Tìm khách hàng..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id} className="font-medium">
                  <span className="flex items-center gap-2">
                    {c.fullName} -{" "}
                    <span className="text-xs text-slate-400">{c.phone || "No Phone"}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCustomerData && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedCustomerData.avatarUrl || undefined} />
                <AvatarFallback>{selectedCustomerData.fullName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-black text-slate-900">{selectedCustomerData.fullName}</div>
                <div className="text-xs font-bold text-slate-500 uppercase">
                  {selectedCustomerData.customerCode}
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-1 text-sm font-medium text-slate-600">
              <p>SĐT: {selectedCustomerData.phone || "---"}</p>
              <p>Đ/C: {selectedCustomerData.address || "---"}</p>
              <Badge variant="secondary" className="mt-2 text-[10px] font-black uppercase">
                {selectedCustomerData.customerType}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <Label htmlFor="order-note">Ghi chú đơn hàng</Label>
          <Input
            id="order-note"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Ghi chú nội bộ..."
            className="h-12 bg-slate-50 font-medium"
          />
        </div>
      </CardContent>
    </Card>
  );
}
