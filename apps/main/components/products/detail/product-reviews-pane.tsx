import { MessageSquare } from "lucide-react";

export function ProductReviewsPane() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <MessageSquare className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">Chưa có đánh giá</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm này. Đánh giá của bạn sẽ giúp khách
        hàng khác lựa chọn dễ dàng hơn.
      </p>
      <button
        type="button"
        className="mt-2 rounded-xl border border-border bg-card px-4 py-2 text-[13px] font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        Viết đánh giá
      </button>
    </div>
  );
}
