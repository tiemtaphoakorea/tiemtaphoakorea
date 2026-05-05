"use client";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

export default function SettingsWidgets() {
  const [contactMessenger, setContactMessenger] = useState("");
  const [contactSaving, setContactSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/contact-widget")
      .then((r) => r.json())
      .then((data) => {
        setContactMessenger(data.messengerUrl ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveContactWidget() {
    setContactSaving(true);
    try {
      const res = await fetch("/api/admin/settings/contact-widget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messengerUrl: contactMessenger }),
      });
      if (!res.ok) throw new Error("save failed");
      toast.success("Đã lưu widget liên hệ");
    } catch {
      toast.error("Không thể lưu widget liên hệ");
    } finally {
      setContactSaving(false);
    }
  }

  return (
    <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
      <div className={PANEL_CLS}>
        <p className="text-sm text-muted-foreground">
          Cấu hình nút liên hệ nổi ở góc dưới phải cửa hàng. Để trống để ẩn tùy chọn đó.
        </p>
        <p className="text-xs text-muted-foreground">
          Số điện thoại lấy từ{" "}
          <a href="/settings" className="underline underline-offset-2">
            Cài đặt → Cửa hàng
          </a>
          .
        </p>
        <Field>
          <FieldLabel>Messenger URL</FieldLabel>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-blue-500" strokeWidth={2} />
            <Input
              placeholder="VD: https://m.me/ten-trang"
              value={contactMessenger}
              onChange={(e) => setContactMessenger(e.target.value)}
            />
          </div>
        </Field>
        <Button className="self-start" onClick={saveContactWidget} disabled={contactSaving}>
          {contactSaving ? "Đang lưu..." : "Lưu widget"}
        </Button>
      </div>
    </Card>
  );
}
