import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { CheckCircle2, Copy } from "lucide-react";

interface CredentialsDialogProps {
  credentials: any;
  onClose: () => void;
  onCopy: (text: string) => void;
}

export function CredentialsDialog({ credentials, onClose, onCopy }: CredentialsDialogProps) {
  return (
    <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-4xl border-none shadow-2xl sm:max-w-md">
        <DialogHeader className="items-center space-y-4 pt-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black">
            {credentials?.isReset ? "Đã đặt lại mật khẩu!" : "Tạo khách hàng thành công!"}
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Vui lòng sao chép và gửi thông tin đăng nhập này cho khách hàng. Đây là lần duy nhất bạn
            có thể thấy mật khẩu này.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 rounded-3xl border border-slate-100 bg-slate-50 p-6">
          <div className="space-y-1">
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Mã khách hàng / Email
            </p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-black text-slate-900">
                {credentials?.customerCode || credentials?.email}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy(credentials?.customerCode || credentials?.email)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Mật khẩu mới
            </p>
            <div className="flex items-center justify-between">
              <p className="text-primary text-lg font-black">{credentials?.password}</p>
              <Button variant="ghost" size="sm" onClick={() => onCopy(credentials?.password)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-center pb-4">
          <Button
            onClick={onClose}
            className="shadow-primary/20 h-11 rounded-xl px-8 font-bold shadow-lg"
          >
            Đã lưu thông tin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
