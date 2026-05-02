"use client";

import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { Input } from "@workspace/ui/components/input";
import { ArrowUp, CircleDollarSign, Facebook, Globe, Instagram, Youtube, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type FooterConfig = {
  tagline?: string;
  hq?: string;
  office?: string;
  officeDetail?: string;
  copyright?: string;
};

type SocialConfig = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
};

type FooterProps = {
  footer?: FooterConfig;
  social?: SocialConfig;
};

const DEFAULTS = {
  tagline:
    "Nền tảng thương mại điện tử chuyên cung cấp mỹ phẩm và đồ gia dụng chính hãng từ Hàn Quốc tại Việt Nam.",
  hq: "Seoul, South Korea",
  office: "Hồ Chí Minh, Việt Nam",
  officeDetail: "Quận 1, TP. Hồ Chí Minh",
  copyright: "© 2024 K-SMART VN",
};

export function Footer({ footer = {}, social = {} }: FooterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const tagline = footer.tagline || DEFAULTS.tagline;
  const office = footer.office || DEFAULTS.office;
  const officeDetail = footer.officeDetail || DEFAULTS.officeDetail;
  const copyright = footer.copyright || DEFAULTS.copyright;

  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter Band — hidden on desktop where NewsletterCta runs above the footer */}
      <div className="border-b border-white/10 md:hidden">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            <div className="space-y-1 text-center lg:text-left">
              <h3 className="font-display text-2xl font-bold text-white">Nhận ưu đãi độc quyền</h3>
              <p className="text-sm text-white/60">Voucher 50k cho đơn hàng đầu tiên của bạn</p>
            </div>
            <div className="flex w-full max-w-md overflow-hidden rounded-full border border-white/15 bg-white/8">
              <Input
                type="email"
                placeholder="Email của bạn..."
                className="h-auto min-w-0 flex-1 border-0 bg-transparent px-5 py-3 text-sm text-white shadow-none placeholder:text-white/40 focus-visible:ring-0"
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
            <span className="font-display text-xl font-bold text-white">
              K<span className="text-primary">-</span>SMART
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-white/55">{tagline}</p>
          <div className="flex gap-2.5">
            <SocialBtn
              icon={<Instagram className="h-4 w-4" />}
              label="Instagram"
              href={social.instagram}
            />
            <SocialBtn
              icon={<Facebook className="h-4 w-4" />}
              label="Facebook"
              href={social.facebook}
            />
            <SocialBtn
              icon={<Youtube className="h-4 w-4" />}
              label="Youtube"
              href={social.youtube}
            />
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">
            Về chúng tôi
          </h4>
          <ul className="space-y-3">
            <FooterLink label="Giới thiệu" />
            <FooterLink label="Liên hệ" />
          </ul>
        </div>

        <div>
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Hỗ trợ</h4>
          <ul className="space-y-3">
            <FooterLink label="Vận chuyển & Giao hàng" />
            <FooterLink label="Chính sách đổi trả" />
            <FooterLink label="Kiểm tra đơn hàng" />
          </ul>
        </div>

        {/* Office */}
        <div>
          <h4 className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">
            Địa chỉ
          </h4>
          <p className="text-sm font-semibold text-white/80">{officeDetail || office}</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-5 md:flex-row">
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-white/40 md:justify-start">
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-white cursor-pointer"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href={PUBLIC_ROUTES.HOME}
              className="transition-colors hover:text-white cursor-pointer"
            >
              Chính sách bảo mật
            </Link>
          </div>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <button
              type="button"
              aria-label="Chọn ngôn ngữ"
              className="inline-flex items-center gap-1 transition-colors hover:text-white cursor-pointer"
            >
              <Globe className="h-3 w-3" /> Tiếng Việt
            </button>
            <button
              type="button"
              aria-label="Chọn tiền tệ"
              className="inline-flex items-center gap-1 transition-colors hover:text-white cursor-pointer"
            >
              <CircleDollarSign className="h-3 w-3" /> VND
            </button>
            <span>{copyright}</span>
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

function SocialBtn({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const cls =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white/60 transition-all hover:border-primary/50 hover:bg-primary/20 hover:text-white";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={cls}>
        {icon}
      </a>
    );
  }
  return (
    <button type="button" aria-label={label} className={cls}>
      {icon}
    </button>
  );
}

function FooterLink({ label }: { label: string }) {
  return (
    <li>
      <Link
        href="/"
        className="cursor-pointer text-sm text-white/55 transition-colors hover:text-white"
      >
        {label}
      </Link>
    </li>
  );
}
