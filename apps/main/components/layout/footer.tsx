"use client";

import { PUBLIC_ROUTES } from "@repo/shared/routes";
import { CircleDollarSign, Facebook, Globe, Instagram, Send, Youtube } from "lucide-react";
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
    <footer className="border-t border-gray-100 bg-white pt-16 dark:border-slate-900 dark:bg-slate-950">
      {/* Newsletter / Upper Footer */}
      <div className="container mx-auto px-4 pb-16">
        <div className="bg-primary/5 flex flex-col items-center justify-between gap-8 rounded-[3rem] p-8 md:p-12 lg:flex-row">
          <div className="space-y-2 text-center lg:text-left">
            <h3 className="text-primary text-2xl font-black md:text-3xl">Đăng ký nhận ưu đãi</h3>
            <p className="text-muted-foreground font-medium">
              Nhận ngay voucher 50k cho đơn hàng đầu tiên của bạn
            </p>
          </div>
          <div className="shadow-primary/5 flex w-full rounded-full bg-white p-2 shadow-xl lg:w-fit">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="flex-1 border-none bg-transparent px-6 text-sm font-medium focus:ring-0"
            />
            <button
              type="button"
              aria-label="Đăng ký nhận ưu đãi"
              className="bg-primary hover:bg-primary/90 rounded-full p-3 text-white transition-all"
            >
              <Send className="h-5 w-5" />
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
          <div className="flex justify-center gap-4 md:justify-start">
            <SocialIcon icon={<Instagram className="h-5 w-5" />} />
            <SocialIcon icon={<Facebook className="h-5 w-5" />} />
            <SocialIcon icon={<Youtube className="h-5 w-5" />} />
          </div>
        </div>

        <div>
          <h4 className="text-primary mb-6 text-base font-black tracking-wider uppercase">
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
          <h4 className="text-primary mb-6 text-base font-black tracking-wider uppercase">
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
          <h4 className="text-primary mb-6 text-base font-black tracking-wider uppercase">
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
      <div className="border-t border-gray-50 bg-gray-50/30 py-8 dark:border-slate-900 dark:bg-slate-900/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <div className="text-muted-foreground flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-bold tracking-widest uppercase md:justify-start">
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
            <div className="text-muted-foreground flex items-center gap-4 text-[10px] font-bold tracking-widest">
              <button
                type="button"
                aria-label="Chọn ngôn ngữ"
                className="hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Globe className="h-3 w-3" /> TIẾNG VIỆT
              </button>
              <button
                type="button"
                aria-label="Chọn tiền tệ"
                className="hover:text-primary flex items-center gap-1 transition-colors"
              >
                <CircleDollarSign className="h-3 w-3" /> VND - ĐỒNG
              </button>
            </div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-widest">
              © 2024 K-SMART VN
            </p>
          </div>
        </div>
      </div>

      {/* Back to top - Floated button instead of a whole bar */}
      <button
        type="button"
        onClick={scrollToTop}
        className={`bg-primary group fixed right-5 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <span className="sr-only">Lên đầu trang</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 transition-transform group-hover:-translate-y-1"
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
