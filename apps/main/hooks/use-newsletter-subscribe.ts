"use client";

import { useCallback, useState } from "react";

type SubscribeStatus = "idle" | "submitting" | "success" | "error";

type NewsletterResponse = {
  success?: boolean;
  alreadySubscribed?: boolean;
  error?: string;
};

export function useNewsletterSubscribe(source: string) {
  const [status, setStatus] = useState<SubscribeStatus>("idle");
  const [message, setMessage] = useState("");

  const subscribe = useCallback(
    async (email: string): Promise<boolean> => {
      const trimmed = email.trim();
      if (!trimmed) {
        setStatus("error");
        setMessage("Vui lòng nhập email");
        return false;
      }

      setStatus("submitting");
      setMessage("");

      try {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmed, source }),
        });
        const data = (await res.json().catch(() => ({}))) as NewsletterResponse;

        if (!res.ok || !data.success) {
          setStatus("error");
          setMessage(data.error || "Không thể đăng ký lúc này");
          return false;
        }

        setStatus("success");
        setMessage(
          data.alreadySubscribed ? "Email đã được đăng ký trước đó" : "Đã đăng ký nhận ưu đãi",
        );
        return true;
      } catch {
        setStatus("error");
        setMessage("Lỗi kết nối, vui lòng thử lại");
        return false;
      }
    },
    [source],
  );

  return { status, message, subscribe };
}
