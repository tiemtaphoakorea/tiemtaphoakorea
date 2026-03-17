import { ChevronRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PUBLIC_ROUTES } from "@/lib/routes";

export function Hero() {
  return (
    <section className="bg-white pt-6 pb-12 dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Main Banner */}
        <div className="shadow-primary/10 relative h-[300px] overflow-hidden rounded-[2rem] shadow-2xl md:h-[450px] lg:h-[550px]">
          <Image
            src="https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=2000"
            alt="Mỹ phẩm Hàn Quốc cao cấp"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Soft Gradient Overlay */}
          <div className="from-primary/40 absolute inset-0 bg-gradient-to-tr via-transparent to-transparent" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-2xl transform space-y-4 px-8 transition-transform duration-700 hover:translate-x-2 md:space-y-6 md:px-16">
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-1.5 backdrop-blur-md">
                <Sparkles className="h-4 w-4 fill-white text-white" />
                <span className="text-xs font-bold tracking-widest text-white uppercase">
                  Siêu sale tháng 12
                </span>
              </div>
              <h1 className="text-4xl leading-[1.1] font-extrabold tracking-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl">
                NÂNG TẦM <br /> VẺ ĐẸP HÀN
              </h1>
              <p className="text-base font-medium text-white/90 drop-shadow-md md:text-xl">
                Ưu đãi đến 50% các dòng mỹ phẩm cao cấp. Sản phẩm chính hãng, nhập khẩu trực tiếp từ
                Seoul.
              </p>
              <div className="flex gap-4">
                <Button
                  size="lg"
                  className="text-primary h-14 rounded-full bg-white px-10 text-lg font-bold shadow-xl shadow-black/10 hover:bg-gray-100"
                  asChild
                >
                  <Link href={PUBLIC_ROUTES.PRODUCTS}>Xem sản phẩm</Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="hover:text-primary h-14 rounded-full border-2 border-white bg-transparent px-10 text-lg font-bold text-white shadow-xl shadow-black/10 backdrop-blur-md transition-all hover:bg-white"
                >
                  Liên hệ ngay
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Categories */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <CategoryCard
            title="Dưỡng da chuyên sâu"
            image="https://images.unsplash.com/photo-1556229162-5c63ed9c4efb?auto=format&fit=crop&q=80&w=400"
            count="250+ sản phẩm"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Chăm sóc da")}
          />
          <CategoryCard
            title="Đồ ăn & Bánh kẹo"
            image="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=400"
            count="120+ vị mới"
            to={PUBLIC_ROUTES.PRODUCTS}
          />
          <CategoryCard
            title="Gia dụng thông minh"
            image="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"
            count="Tiêu chuẩn Hàn"
            to={PUBLIC_ROUTES.PRODUCTS_BY_CATEGORY("Đồ gia dụng")}
          />
          <CategoryCard
            title="Hàng mới về"
            image="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&q=80&w=400"
            count="Bắt trend Seoul"
            to={PUBLIC_ROUTES.PRODUCTS_BY_SORT("latest")}
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
}: {
  title: string;
  image: string;
  count: string;
  to?: string;
}) {
  return (
    <Link href={to} className="block">
      <Card className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-[1.5rem] border-none shadow-sm transition-all duration-500 hover:shadow-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 text-white">
          <span className="text-primary-foreground/80 mb-1 text-[10px] font-bold tracking-widest uppercase">
            {count}
          </span>
          <h3 className="group-hover:text-primary mb-2 text-lg font-bold tracking-tight transition-colors">
            {title}
          </h3>
          <span className="flex items-center gap-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
            Xem thêm <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </Card>
    </Link>
  );
}
