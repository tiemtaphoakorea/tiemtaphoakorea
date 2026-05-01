import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ChevronLeft, Loader2, User } from "lucide-react";

interface ChatHeaderProps {
  room: any;
  isConnected: boolean;
  onBack: () => void;
}

export function ChatHeader({ room, isConnected, onBack }: ChatHeaderProps) {
  return (
    <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white/80 px-6 py-0 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="rounded-xl hover:bg-slate-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 ring-1 ring-slate-200">
          <User className="h-6 w-6 text-slate-400" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-black text-slate-900">
            {room.customer.fullName || "Khách hàng"}
          </h2>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 px-1.5 py-0 text-[10px] font-black tracking-wider uppercase"
            >
              {room.customer.customerCode}
            </Badge>
            {room.customer.customerType && (
              <Badge
                variant="secondary"
                className={`border-none px-1.5 py-0 text-[10px] font-black tracking-wider uppercase ${
                  room.customer.customerType === "wholesale"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-blue-500/10 text-blue-600"
                }`}
              >
                {room.customer.customerType === "retail" ? "Bán lẻ" : "Bán sỉ"}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isConnected && (
          <Badge
            variant="secondary"
            className="animate-pulse gap-2 border-none bg-amber-500/10 px-3 py-1 font-bold text-amber-600"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="hidden sm:inline">Đang kết nối...</span>
          </Badge>
        )}
      </div>
    </div>
  );
}
