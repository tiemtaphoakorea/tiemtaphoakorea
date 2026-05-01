"use client";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  Bell,
  Building2,
  Facebook,
  Globe,
  Image as ImageIcon,
  Instagram,
  Layout,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Upload,
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Field, FieldRow } from "@/components/admin/settings/settings-section";

const NOTIF_DEFAULTS: { name: string; defaultOn: boolean }[] = [
  { name: "Đơn hàng mới", defaultOn: true },
  { name: "Hết hàng", defaultOn: true },
  { name: "Đánh giá mới", defaultOn: true },
  { name: "Báo cáo hàng ngày", defaultOn: false },
];

const HOMEPAGE_TOGGLES = [
  { key: "hero", label: "Hiển thị banner Hero", default: true },
  { key: "flashSale", label: "Hiển thị Flash Sale", default: true },
  { key: "categories", label: "Hiển thị grid danh mục", default: true },
  { key: "bestSellers", label: "Hiển thị sản phẩm bán chạy", default: true },
  { key: "newArrivals", label: "Hiển thị hàng mới về", default: true },
  { key: "blog", label: "Hiển thị bài viết blog", default: false },
];

const SECTIONS = [
  { value: "store", label: "Cửa hàng", icon: Building2 },
  { value: "branding", label: "Nhận diện", icon: Palette },
  { value: "homepage", label: "Trang chủ", icon: Layout },
  { value: "footer", label: "Footer", icon: MapPin },
  { value: "social", label: "Mạng xã hội", icon: Globe },
  { value: "contact-widget", label: "Widget liên hệ", icon: MessageCircle },
  { value: "notif", label: "Thông báo", icon: Bell },
] as const;

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

/** Image dropzone — placeholder upload UI used for logo, banner, etc. */
function ImageDrop({ hint }: { hint: string }) {
  return (
    <div className="flex h-[110px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border-2 border-dashed border-border bg-muted/40 transition-colors hover:border-primary hover:bg-primary/5">
      <Upload className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.5} />
      <span className="px-3 text-center text-xs font-medium text-muted-foreground">{hint}</span>
    </div>
  );
}

export default function AdminSettings() {
  const [notif, setNotif] = useState(NOTIF_DEFAULTS.map((n) => n.defaultOn));
  const [homepage, setHomepage] = useState(
    Object.fromEntries(HOMEPAGE_TOGGLES.map((t) => [t.key, t.default])),
  );
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessenger, setContactMessenger] = useState("");
  const [contactSaving, setContactSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/contact-widget")
      .then((r) => r.json())
      .then((data) => {
        setContactPhone(data.phoneNumber ?? "");
        setContactMessenger(data.messengerUrl ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveContactWidget() {
    setContactSaving(true);
    try {
      await fetch("/api/admin/settings/contact-widget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: contactPhone, messengerUrl: contactMessenger }),
      });
    } finally {
      setContactSaving(false);
    }
  }

  return (
    <Tabs defaultValue="store" className="w-full gap-4">
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

      <Card className="overflow-hidden border border-border p-0 shadow-none">
        {/* Store info */}
        <TabsContent value="store" className={PANEL_CLS}>
          <Field label="Tên cửa hàng">
            <Input defaultValue="Tiệm Korea" />
          </Field>
          <Field label="Slogan thương hiệu">
            <Input defaultValue="Hàng Hàn xịn — Giá Việt thân thiện — Giao tận nơi nhanh." />
          </Field>
          <Field label="Mô tả">
            <Textarea
              defaultValue="Nhập khẩu hàng Hàn Quốc chính hãng — K-Food, K-Beauty, K-Drink"
              rows={3}
            />
          </Field>
          <FieldRow>
            <Field label="Hotline">
              <Input defaultValue="1900 0099" />
            </Field>
            <Field label="Email">
              <Input defaultValue="hello@tiemkorea.vn" />
            </Field>
          </FieldRow>
          <Field label="Địa chỉ trụ sở">
            <Input defaultValue="123 Lê Lợi, Quận 1, TP.HCM" />
          </Field>
          <Button className="self-start">Lưu thay đổi</Button>
        </TabsContent>

        {/* Logo & branding */}
        <TabsContent value="branding" className={PANEL_CLS}>
          <FieldRow>
            <Field label="Logo chính (ngang)">
              <ImageDrop hint="PNG/SVG · 1:3 · ≤500KB" />
            </Field>
            <Field label="Logo vuông (favicon)">
              <ImageDrop hint="PNG/SVG · 1:1 · ≤200KB" />
            </Field>
          </FieldRow>
          <Field label="Logo accent (chữ phụ trên logo)">
            <Input defaultValue="" />
          </Field>
          <FieldRow>
            <Field label="Màu thương hiệu">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
                <span className="inline-block h-5 w-5 rounded-md bg-primary" />
                <Input
                  className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
                  defaultValue="#6366F1"
                />
              </div>
            </Field>
            <Field label="Màu nhấn (accent)">
              <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
                <span className="inline-block h-5 w-5 rounded-md bg-amber-500" />
                <Input
                  className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
                  defaultValue="#F59E0B"
                />
              </div>
            </Field>
          </FieldRow>
          <Button className="self-start">Lưu nhận diện</Button>
        </TabsContent>

        {/* Homepage display & content */}
        <TabsContent value="homepage" className={PANEL_CLS}>
          <Field label="Banner Hero — ảnh">
            <ImageDrop hint="JPG/PNG · 16:9 · ≤2MB · ưu tiên 1920×1080" />
          </Field>
          <Field label="Banner Hero — tiêu đề">
            <Input defaultValue="Tuần Lễ Hàn — Sale tới 40%" />
          </Field>
          <Field label="Banner Hero — phụ đề">
            <Input defaultValue="Mì cay, mặt nạ, soju... freeship đơn từ 299k" />
          </Field>
          <FieldRow>
            <Field label="CTA chính">
              <Input defaultValue="Săn ngay" />
            </Field>
            <Field label="Đường dẫn CTA">
              <Input defaultValue="/products?category=K-Food" />
            </Field>
          </FieldRow>
          <Field label="Khối hiển thị">
            <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/30 p-3">
              {HOMEPAGE_TOGGLES.map((t) => (
                <div key={t.key} className="flex items-center justify-between">
                  <span className="text-[13px] font-medium">{t.label}</span>
                  <Switch
                    checked={homepage[t.key]}
                    onCheckedChange={(v) => setHomepage((p) => ({ ...p, [t.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </Field>
          <FieldRow>
            <Field label="Số SP / mỗi khối">
              <Select defaultValue="8">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 sản phẩm</SelectItem>
                  <SelectItem value="8">8 sản phẩm</SelectItem>
                  <SelectItem value="12">12 sản phẩm</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Sắp xếp mặc định">
              <Select defaultValue="bestseller">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bestseller">Bán chạy</SelectItem>
                  <SelectItem value="newest">Mới nhất</SelectItem>
                  <SelectItem value="price-asc">Giá tăng dần</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldRow>
          <Field label="SEO — Tiêu đề trang chủ">
            <Input defaultValue="Tiệm Korea — Cửa hàng tạp hoá Hàn Quốc tại Việt Nam" />
          </Field>
          <Field label="SEO — Mô tả meta">
            <Textarea
              defaultValue="Nhập khẩu chính hãng K-Food, K-Beauty, K-Drink. Freeship đơn từ 299k. Giao hàng 2H tại HCM, Hà Nội."
              rows={2}
            />
          </Field>
          <Button className="self-start">Lưu trang chủ</Button>
        </TabsContent>

        {/* Footer info */}
        <TabsContent value="footer" className={PANEL_CLS}>
          <Field label="Tên công ty (footer)">
            <Input defaultValue="Công ty TNHH Tiệm Korea Vietnam" />
          </Field>
          <Field label="Mã số thuế">
            <Input defaultValue="0312345678" />
          </Field>
          <Field label="Địa chỉ đăng ký kinh doanh">
            <Textarea
              defaultValue="123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
              rows={2}
            />
          </Field>
          <FieldRow>
            <Field label="Hotline footer">
              <Input defaultValue="1900 0099 (8h - 22h)" />
            </Field>
            <Field label="Email CSKH">
              <Input defaultValue="cskh@tiemkorea.vn" />
            </Field>
          </FieldRow>
          <Field label="Giờ làm việc">
            <Input defaultValue="Thứ 2 - Chủ nhật · 08:00 - 22:00" />
          </Field>
          <Field label="Văn bản cuối footer (copyright)">
            <Input defaultValue="© 2024 Tiệm Korea. All rights reserved." />
          </Field>
          <Field label="Logo Bộ Công Thương đã đăng ký">
            <ImageDrop hint="PNG · ≤200KB" />
          </Field>
          <Button className="self-start">Lưu footer</Button>
        </TabsContent>

        {/* Social links */}
        <TabsContent value="social" className={PANEL_CLS}>
          <Field label="Facebook">
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
              <Input defaultValue="https://facebook.com/tiemkorea" />
            </div>
          </Field>
          <Field label="Instagram">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={2} />
              <Input defaultValue="https://instagram.com/tiemkorea" />
            </div>
          </Field>
          <Field label="TikTok">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
              <Input defaultValue="https://tiktok.com/@tiemkorea" />
            </div>
          </Field>
          <Field label="YouTube">
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 shrink-0 text-red-600" strokeWidth={2} />
              <Input defaultValue="https://youtube.com/@tiemkorea" />
            </div>
          </Field>
          <Field label="Zalo OA">
            <Input defaultValue="https://zalo.me/tiemkorea" />
          </Field>
          <Button className="self-start">Lưu liên kết</Button>
        </TabsContent>

        {/* Contact widget */}
        <TabsContent value="contact-widget" className={PANEL_CLS}>
          <p className="text-[13px] text-muted-foreground">
            Cấu hình nút liên hệ nổi ở góc dưới phải cửa hàng. Để trống để ẩn tùy chọn đó.
          </p>
          <Field label="Số điện thoại">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
              <Input
                placeholder="VD: +84901234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </Field>
          <Field label="Messenger URL">
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

        {/* Notifications */}
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
