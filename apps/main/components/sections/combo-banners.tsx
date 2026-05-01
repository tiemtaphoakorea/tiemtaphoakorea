import { ArrowRight, Gift } from "lucide-react";
import Link from "next/link";

export function ComboBanners() {
  return (
    <section className="bg-background py-6 md:py-10">
      <div className="container mx-auto grid gap-4 px-4 md:grid-cols-2">
        <article
          className="relative flex min-h-[140px] items-center gap-4 overflow-hidden rounded-3xl px-6 py-6 text-white md:px-7"
          style={{
            background: "linear-gradient(135deg,var(--foreground) 0%,var(--primary) 100%)",
          }}
        >
          <div
            className="grid h-16 w-16 shrink-0 place-items-center text-5xl font-black text-white/85"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            韓
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-[20px] font-bold leading-tight tracking-tight md:text-[22px]">
              K-Food Festival
            </h3>
            <p className="mb-3 text-[13px] leading-relaxed text-white/85">
              Mua mì + bánh + nước cùng lúc, giảm thêm 50k. Áp dụng đến hết tuần này.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-xl bg-warning px-5 py-3 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-warning/90"
            >
              Săn combo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </article>

        <article
          className="relative flex min-h-[140px] items-center gap-4 overflow-hidden rounded-3xl px-6 py-6 text-white md:px-7"
          style={{
            background: "linear-gradient(135deg,#F59E0B 0%,#FB923C 100%)",
          }}
        >
          <div
            className="grid h-16 w-16 shrink-0 place-items-center text-5xl font-black text-white/90"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            美
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-[20px] font-bold leading-tight tracking-tight md:text-[22px]">
              Glow Skin Set
            </h3>
            <p className="mb-3 text-[13px] leading-relaxed text-white/90">
              Mua mặt nạ ≥ 300k tặng kèm sữa rửa mặt COSRX 50ml. Hết quà ngừng tặng.
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-3 text-[13px] font-semibold leading-none text-white transition-colors hover:bg-foreground/90"
              style={{ boxShadow: "0 4px 0 rgba(0,0,0,0.18)" }}
            >
              Mua ngay <Gift className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
