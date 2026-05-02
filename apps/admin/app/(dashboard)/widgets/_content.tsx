"use client";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Bell, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const SECTIONS = [
  { value: "contact-widget", label: "Widget liên hệ", icon: MessageCircle },
  { value: "notif", label: "Thông báo", icon: Bell },
] as const;

const NOTIF_DEFAULTS: { name: string; defaultOn: boolean }[] = [
  { name: "Đơn hàng mới", defaultOn: true },
  { name: "Hết hàng", defaultOn: true },
  { name: "Đánh giá mới", defaultOn: true },
  { name: "Báo cáo hàng ngày", defaultOn: false },
];

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

export default function SettingsWidgets() {
  const [notif, setNotif] = useState(NOTIF_DEFAULTS.map((n) => n.defaultOn));
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
    <Tabs defaultValue="contact-widget" className="w-full gap-4">
      <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto px-0">
        {SECTIONS.map((s) => (
          <TabsTrigger
            key={s.value}
            value={s.value}
            className="gap-1.5 px-3 py-2.5 text-[13px] font-semibold"
          >
            <s.icon className="size-4" strokeWidth={2} />
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        <TabsContent value="contact-widget" className={PANEL_CLS}>
          <p className="text-[13px] text-muted-foreground">
            Cấu hình nút liên hệ nổi ở góc dưới phải cửa hàng. Để trống để ẩn tùy chọn đó.
          </p>
          <p className="text-[12px] text-muted-foreground">
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
        </TabsContent>

        <TabsContent value="notif" className={PANEL_CLS}>
          {NOTIF_DEFAULTS.map((n, i) => (
            <div key={n.name} className="flex items-center justify-between">
              <span className="text-[13px] font-medium">{n.name}</span>
              <Switch
                checked={notif[i]}
                onCheckedChange={(v) =>
                  setNotif((prev) => prev.map((p, idx) => (idx === i ? v : p)))
                }
              />
            </div>
          ))}
        </TabsContent>
      </Card>
    </Tabs>
  );
}
