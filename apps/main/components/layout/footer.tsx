"use client";

import { PUBLIC_ROUTES } from "@repo/shared/routes";
import { CircleDollarSign, Facebook, Globe, Instagram, Youtube } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FooterLink } from "@/components/layout/footer-link";
import { SocialIcon } from "@/components/layout/social-icon";

export function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="border-t border-border bg-white pt-16 dark:border-slate-900 dark:bg-slate-950">
      {/* Newsletter / Upper Footer */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-8 rounded-2xl bg-secondary p-8 md:p-10 lg:flex-row">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-2xl font-semibold text-foreground md:text-3xl">Đăng ký nhận ưu đãi</h3>
            <p className="text-muted-foreground font-medium">
              Nhận ngay voucher 50k cho đơn hàng đầu tiên của bạn
            </p>
          </div>
          <div className="flex w-full overflow-hidden rounded-full border border-border bg-background lg:w-auto">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="button"
              aria-label="Đăng ký nhận ưu đãi"
              className="bg-primary hover:bg-primary/90 rounded-full m-1 px-5 py-2 text-sm font-medium text-white transition-all"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto grid grid-cols-2 gap-12 px-4 pb-12 md:grid-cols-4">
        <div className="col-span-2 space-y-6 text-center md:col-span-1 md:text-left">
          <Link
            href={PUBLIC_ROUTES.HOME}
            className="group flex items-center justify-center gap-2 md:justify-start"
          >
            <div className="bg-primary flex h-10 w-10 rotate-3 items-center justify-center rounded-xl transition-transform group-hover:rotate-0">
              <span className="text-2xl font-bold text-white">K</span>
            </div>
            <span className="text-primary text-2xl font-bold">K-SMART</span>
          </Link>
          <p className="text-muted-foreground text-sm leading-relaxed font-medium">
            K-SMART là nền tảng thương mại điện tử chuyên cung cấp mỹ phẩm và đồ gia dụng chính hãng
            từ Hàn Quốc tại Việt Nam.
          </p>
          <div className="flex justify-center gap-3 md:justify-start">
            <SocialIcon icon={<Instagram className="h-4 w-4" />} />
            <SocialIcon icon={<Facebook className="h-4 w-4" />} />
            <SocialIcon icon={<Youtube className="h-4 w-4" />} />
          </div>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold text-foreground">
            Về chúng tôi
          </h4>
          <ul className="space-y-3">
            <FooterLink label="Câu chuyện thương hiệu" />
            <FooterLink label="Tuyển dụng" />
            <FooterLink label="Thông cáo báo chí" />
            <FooterLink label="Hệ thống cửa hàng" />
            <FooterLink label="Liên hệ" />
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-sm font-semibold text-foreground">
            Hỗ trợ khách hàng
          </h4>
          <ul className="space-y-3">
            <FooterLink label="Trung tâm trợ giúp" />
            <FooterLink label="Vận chuyển & Giao hàng" />
            <FooterLink label="Chính sách bảo hành" />
            <FooterLink label="Chính sách đổi trả" />
            <FooterLink label="Kiểm tra đơn hàng" />
          </ul>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="mb-5 text-sm font-semibold text-foreground">
            Văn phòng
          </h4>
          <div className="space-y-4 pt-1">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                Trụ sở chính
              </span>
              <span className="mt-1 text-sm font-bold">Seoul, South Korea</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                Văn phòng đại diện
              </span>
              <span className="mt-1 text-sm font-bold">Hồ Chí Minh, Việt Nam</span>
              <p className="text-muted-foreground mt-1 text-xs">Quận 1, TP. Hồ Chí Minh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50 bg-gray-50/30 py-8 dark:border-slate-900 dark:bg-slate-900/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground md:justify-start">
            <Link href={PUBLIC_ROUTES.HOME} className="hover:text-primary transition-colors">
              Điều khoản sử dụng
            </Link>
            <Link href={PUBLIC_ROUTES.HOME} className="hover:text-primary transition-colors">
              Chính sách bảo mật
            </Link>
            <Link href={PUBLIC_ROUTES.HOME} className="hover:text-primary transition-colors">
              Câu hỏi thường gặp
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button
                type="button"
                aria-label="Chọn ngôn ngữ"
                className="hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Globe className="h-3 w-3" /> Tiếng Việt
              </button>
              <button
                type="button"
                aria-label="Chọn tiền tệ"
                className="hover:text-primary flex items-center gap-1 transition-colors"
              >
                <CircleDollarSign className="h-3 w-3" /> VND
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2024 K-SMART VN
            </p>
          </div>
        </div>
      </div>

      {/* Back to top - Floated button instead of a whole bar */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`bg-primary group fixed right-5 bottom-24 z-40 flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 active:scale-95 ${
          isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="sr-only">Lên đầu trang</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 transition-transform group-hover:-translate-y-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </footer>
  );
}
