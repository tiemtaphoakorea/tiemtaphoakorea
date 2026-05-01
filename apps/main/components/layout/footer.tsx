"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Input } from "@workspace/ui/components/input";
import { ArrowUp, CircleDollarSign, Facebook, Globe, Instagram, Youtube, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Footer() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-foreground text-background dark:bg-card dark:text-foreground">
      {/* Newsletter Band — hidden on desktop where NewsletterCta runs above the footer */}
      <div className="border-b border-white/10 md:hidden dark:border-border">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="space-y-1 text-center lg:text-left">
              <h3 className="font-display text-2xl font-bold text-white dark:text-foreground">
                Nhận ưu đãi độc quyền
              </h3>
              <p className="text-sm text-white/60 dark:text-muted-foreground">
                Voucher 50k cho đơn hàng đầu tiên của bạn
              </p>
            </div>
            <div className="flex w-full max-w-md overflow-hidden rounded-full border border-white/15 bg-white/8 dark:border-border dark:bg-muted">
              <Input
                type="email"
                placeholder="Email của bạn..."
                className="h-auto min-w-0 flex-1 border-0 bg-transparent px-5 py-3 text-sm text-white shadow-none placeholder:text-white/40 focus-visible:ring-0 dark:text-foreground dark:placeholder:text-muted-foreground"
              />
              <button
                type="button"
                aria-label="Đăng ký nhận ưu đãi"
                className="m-1 rounded-full bg-primary px-5 py-2 text-xs font-bold text-white transition-all hover:bg-primary/90 cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container mx-auto grid grid-cols-2 gap-10 px-4 py-12 md:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 space-y-5 md:col-span-1">
          <Link
            href={PUBLIC_ROUTES.HOME}
            className="group inline-flex items-center gap-2.5 cursor-pointer"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/40 transition-all group-hover:shadow-primary/60">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white dark:text-foreground">
              K<span className="text-primary">-</span>SMART
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-white/55 dark:text-muted-foreground">
            Nền tảng thương mại điện tử chuyên cung cấp mỹ phẩm và đồ gia dụng chính hãng từ Hàn
            Quốc tại Việt Nam.
          </p>
          <div className="flex gap-2.5">
            <SocialBtn icon={<Instagram className="h-4 w-4" />} label="Instagram" />
            <SocialBtn icon={<Facebook className="h-4 w-4" />} label="Facebook" />
            <SocialBtn icon={<Youtube className="h-4 w-4" />} label="Youtube" />
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40 dark:text-muted-foreground">
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
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40 dark:text-muted-foreground">
            Hỗ trợ
          </h4>
          <ul className="space-y-3">
            <FooterLink label="Trung tâm trợ giúp" />
            <FooterLink label="Vận chuyển & Giao hàng" />
            <FooterLink label="Chính sách bảo hành" />
            <FooterLink label="Chính sách đổi trả" />
            <FooterLink label="Kiểm tra đơn hàng" />
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40 dark:text-muted-foreground">
            Văn phòng
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 dark:text-muted-foreground">
                Trụ sở chính
              </p>
              <p className="mt-1 text-sm font-semibold text-white/80 dark:text-foreground">
                Seoul, South Korea
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 dark:text-muted-foreground">
                Văn phòng đại diện
              </p>
              <p className="mt-1 text-sm font-semibold text-white/80 dark:text-foreground">
                Hồ Chí Minh, Việt Nam
              </p>
              <p className="mt-0.5 text-xs text-white/40 dark:text-muted-foreground">
                Quận 1, TP. Hồ Chí Minh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/8 dark:border-border">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-5 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/40 dark:text-muted-foreground md:justify-start">
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-white dark:hover:text-foreground cursor-pointer"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-white dark:hover:text-foreground cursor-pointer"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-white dark:hover:text-foreground cursor-pointer"
            >
              Câu hỏi thường gặp
            </Link>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40 dark:text-muted-foreground">
            <button
              type="button"
              aria-label="Chọn ngôn ngữ"
              className="inline-flex items-center gap-1 transition-colors hover:text-white dark:hover:text-foreground cursor-pointer"
            >
              <Globe className="h-3 w-3" /> Tiếng Việt
            </button>
            <button
              type="button"
              aria-label="Chọn tiền tệ"
              className="inline-flex items-center gap-1 transition-colors hover:text-white dark:hover:text-foreground cursor-pointer"
            >
              <CircleDollarSign className="h-3 w-3" /> VND
            </button>
            <span>© 2024 K-SMART VN</span>
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Lên đầu trang"
        className={`fixed right-5 bottom-24 z-40 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:bg-primary/90 hover:shadow-primary/60 active:scale-95 ${
          isVisible
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-2"
        }`}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </footer>
  );
}

function SocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/60 transition-all hover:border-primary/50 hover:bg-primary/20 hover:text-white dark:border-border dark:text-muted-foreground dark:hover:text-foreground"
    >
      {icon}
    </button>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <li>
      <Link
        href="/"
        className="cursor-pointer text-sm text-white/55 transition-colors hover:text-white dark:text-muted-foreground dark:hover:text-foreground"
      >
        {label}
      </Link>
    </li>
  );
}
