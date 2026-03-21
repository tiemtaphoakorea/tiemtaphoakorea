import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRight, ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-background pb-10 pt-6 dark:bg-background">
      <div className="container mx-auto px-4">
        {/* Main Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background image */}
          <div className="relative h-[320px] md:h-[460px] lg:h-[560px]">
            <Image
              src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=2000"
              alt="Mỹ phẩm Hàn Quốc cao cấp"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            {/* Violet tint accent */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/30 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-xl space-y-5 px-8 md:px-14">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                <span className="text-xs font-semibold text-white/90">
                  Hàng chính hãng từ Seoul
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow md:text-6xl lg:text-7xl">
                NÂNG TẦM
                <br />
                <span className="text-violet-300">VẺ ĐẸP HÀN</span>
              </h1>

              <p className="text-sm font-medium text-white/80 md:text-base">
                Ưu đãi đến 50% các dòng mỹ phẩm cao cấp. Nhập khẩu trực tiếp từ Seoul.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="h-12 rounded-full bg-primary px-8 text-sm font-bold shadow-lg shadow-primary/40 hover:bg-primary/90 hover:shadow-primary/60 transition-all"
                  asChild
                >
                  <Link href={PUBLIC_ROUTES.PRODUCTS}>
                    Mua ngay <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="h-12 rounded-full border border-white/30 bg-white/10 px-8 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all"
                >
                  Khám phá thêm
                </Button>
              </div>
            </div>
          </div>

          {/* Decorative tag */}
          <div className="absolute right-6 top-6 hidden md:block">
            <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md text-center">
              <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Ưu đãi</p>
              <p className="font-display text-3xl font-extrabold text-white">50%</p>
              <p className="text-xs text-white/70">cho đơn đầu tiên</p>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CategoryCard
            title="Dưỡng da chuyên sâu"
            image="https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?auto=format&fit=crop&q=80&w=400"
            count="250+ sản phẩm"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Chăm sóc da")}
            accentColor="from-violet-500/70"
          />
          <CategoryCard
            title="Đồ ăn & Bánh kẹo"
            image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400"
            count="120+ vị mới"
            to={PUBLIC_ROUTES.PRODUCTS}
            accentColor="from-orange-500/70"
          />
          <CategoryCard
            title="Gia dụng thông minh"
            image="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"
            count="Tiêu chuẩn Hàn"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Đồ gia dụng")}
            accentColor="from-sky-500/70"
          />
          <CategoryCard
            title="Hàng mới về"
            image="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=400"
            count="Bắt trend Seoul"
            to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("latest")}
            accentColor="from-rose-500/70"
          />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  title,
  image,
  count,
  to = PUBLIC_ROUTES.PRODUCTS,
  accentColor = "from-primary/70",
}: {
  title: string;
  image: string;
  count: string;
  to?: string;
  accentColor?: string;
}) {
  return (
    <Link href={to} className="group block cursor-pointer">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 1024px) 50vw, 25vw"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t ${accentColor} via-black/20 to-transparent`}
        />
        <div className="absolute inset-0 flex flex-col justify-end p-4">
          <span className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {count}
          </span>
          <h3 className="text-sm font-bold text-white md:text-base">{title}</h3>
          <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-white/80 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5">
            Xem thêm <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
