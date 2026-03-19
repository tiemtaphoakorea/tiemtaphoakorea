import { Loader2, Store } from "lucide-react";

interface CustomerChatHeaderProps {
  isConnected: boolean;
}

export function CustomerChatHeader({ isConnected }: CustomerChatHeaderProps) {
  return (
    <div className="bg-card flex items-center gap-4 border-b p-4">
      <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
        <Store className="text-primary h-6 w-6" />
      </div>
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Chat với Shop</h1>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          {isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <span>Đang trực tuyến</span>
            </>
          ) : (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Đang kết nối...</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
