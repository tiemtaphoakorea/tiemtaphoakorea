"use client";

import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { useNewsletterSubscribe } from "@/hooks/use-newsletter-subscribe";
import { GENERATED_ICONS, GeneratedIcon } from "./generated-icon";

export function NewsletterCta() {
  const [email, setEmail] = useState("");
  const { status, message, subscribe } = useNewsletterSubscribe("newsletter-cta");
  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  return (
    <section className="hidden md:block">
      <div className="container mx-auto px-4 py-9">
        <div className="relative flex items-center justify-between gap-6 overflow-hidden rounded-3xl bg-foreground px-10 py-8 text-white">
          <div className="relative z-[2]">
            <h3 className="m-0 mb-1.5 text-[26px] font-bold leading-[1.25] tracking-[-0.015em]">
              <span className="inline-flex items-center gap-2">
                Nhận voucher <em className="not-italic text-warning">50k</em> ngay khi đăng ký
                <GeneratedIcon
                  src={GENERATED_ICONS.voucher}
                  className="h-8 w-8 rounded-lg object-contain"
                />
              </span>
            </h3>
            <p className="m-0 max-w-[420px] text-[14px] font-normal leading-[1.5] text-white/70">
              Voucher giảm 50k cho đơn đầu tiên + cập nhật flash sale mỗi tuần qua email.
            </p>
          </div>

          <div className="relative z-[2] flex flex-col gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isSuccess) void subscribe(email);
              }}
              className="flex min-w-[380px] gap-2 rounded-full bg-white p-1.5"
            >
              <Input
                type="email"
                required
                placeholder="ten@email.com"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isSuccess}
                className="h-auto flex-1 rounded-full border-0 bg-transparent px-4 py-2.5 text-[14px] font-normal leading-none text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <button
                type="submit"
                disabled={isSubmitting || isSuccess}
                className={`rounded-full border-0 px-5 py-2.5 text-[13px] font-semibold leading-none text-white transition-colors disabled:opacity-80 ${
                  isSuccess ? "bg-success" : "bg-primary hover:bg-primary/90"
                }`}
              >
                {isSubmitting ? (
                  "Đang gửi..."
                ) : isSuccess ? (
                  "Đã đăng ký"
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    Nhận voucher
                    <GeneratedIcon
                      src={GENERATED_ICONS.voucher}
                      className="h-5 w-5 rounded-md object-contain"
                    />
                  </span>
                )}
              </button>
            </form>
            {message && (
              <p
                className={`px-2 text-[12px] ${status === "error" ? "text-warning" : "text-white/70"}`}
                role="status"
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
