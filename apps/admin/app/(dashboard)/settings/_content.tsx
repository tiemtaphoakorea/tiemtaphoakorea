"use client";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { FileUploader } from "@workspace/ui/components/file-uploader";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectOption } from "@workspace/ui/components/native-select";
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
  Youtube,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearShopInfoCache } from "@/lib/print-invoice";
import { uploadImage } from "@/lib/upload-image";

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

export default function AdminSettings() {
  const [notif, setNotif] = useState(NOTIF_DEFAULTS.map((n) => n.defaultOn));
  const [logoMain, setLogoMain] = useState<string[]>([]);
  const [logoSquare, setLogoSquare] = useState<string[]>([]);
  const [heroBanner, setHeroBanner] = useState<string[]>([]);
  const [footerLogo, setFooterLogo] = useState<string[]>([]);
  const [homepage, setHomepage] = useState(
    Object.fromEntries(HOMEPAGE_TOGGLES.map((t) => [t.key, t.default])),
  );
  const [contactPhone, setContactPhone] = useState("");
  const [contactMessenger, setContactMessenger] = useState("");
  const [contactSaving, setContactSaving] = useState(false);

  // Shop info — printed on invoices/receipts
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [shopSaving, setShopSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/contact-widget")
      .then((r) => r.json())
      .then((data) => {
        setContactPhone(data.phoneNumber ?? "");
        setContactMessenger(data.messengerUrl ?? "");
      })
      .catch(() => {});

    fetch("/api/admin/settings/shop-info")
      .then((r) => r.json())
      .then((data) => {
        setShopName(data.name ?? "");
        setShopAddress(data.address ?? "");
        setShopPhone(data.phone ?? "");
        setShopTaxId(data.taxId ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveShopInfo() {
    setShopSaving(true);
    try {
      const res = await fetch("/api/admin/settings/shop-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shopName,
          address: shopAddress,
          phone: shopPhone,
          taxId: shopTaxId,
        }),
      });
      if (!res.ok) throw new Error("save failed");
      clearShopInfoCache();
      toast.success("Đã lưu thông tin cửa hàng");
    } catch {
      toast.error("Không thể lưu thông tin cửa hàng");
    } finally {
      setShopSaving(false);
    }
  }

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

      <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
        {/* Store info — used to print invoices/receipts */}
        <TabsContent value="store" className={PANEL_CLS}>
          <p className="text-[13px] text-muted-foreground">
            Thông tin cửa hàng hiển thị trên hóa đơn (in/sao chép/PDF).
          </p>
          <Field>
            <FieldLabel>Tên cửa hàng</FieldLabel>
            <Input
              placeholder="VD: Tiệm Korea"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Địa chỉ</FieldLabel>
            <Textarea
              placeholder="VD: 123 Lê Lợi, Quận 1, TP.HCM"
              rows={2}
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <Field>
              <FieldLabel>Số điện thoại</FieldLabel>
              <Input
                placeholder="VD: 0909 000 000"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel>Mã số thuế (tuỳ chọn)</FieldLabel>
              <Input
                placeholder="VD: 0312345678"
                value={shopTaxId}
                onChange={(e) => setShopTaxId(e.target.value)}
              />
            </Field>
          </div>
          <Button className="self-start" onClick={saveShopInfo} disabled={shopSaving}>
            {shopSaving ? "Đang lưu..." : "Lưu thông tin cửa hàng"}
          </Button>
        </TabsContent>

        {/* Logo & branding */}
        <TabsContent value="branding" className={PANEL_CLS}>
          <div className="grid grid-cols-2 gap-2.5">
            <Field>
              <FieldLabel>Logo chính (ngang)</FieldLabel>
              <FileUploader
                compact
                value={logoMain}
                onChange={setLogoMain}
                uploadFn={uploadImage}
                maxFiles={1}
                hint="PNG/SVG · 1:3 · ≤500KB"
              />
            </Field>
            <Field>
              <FieldLabel>Logo vuông (favicon)</FieldLabel>
              <FileUploader
                compact
                value={logoSquare}
                onChange={setLogoSquare}
                uploadFn={uploadImage}
                maxFiles={1}
                hint="PNG/SVG · 1:1 · ≤200KB"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel>Logo accent (chữ phụ trên logo)</FieldLabel>
            <Input defaultValue="" />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field>
              <FieldLabel>Màu thương hiệu</FieldLabel>
              <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
                <span className="inline-block h-5 w-5 rounded-md bg-primary" />
                <Input
                  className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
                  defaultValue="#6366F1"
                />
              </div>
            </Field>
            <Field>
              <FieldLabel>Màu nhấn (accent)</FieldLabel>
              <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
                <span className="inline-block h-5 w-5 rounded-md bg-amber-500" />
                <Input
                  className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
                  defaultValue="#F59E0B"
                />
              </div>
            </Field>
          </div>
          <Button className="self-start">Lưu nhận diện</Button>
        </TabsContent>

        {/* Homepage display & content */}
        <TabsContent value="homepage" className={PANEL_CLS}>
          <Field>
            <FieldLabel>Banner Hero — ảnh</FieldLabel>
            <FileUploader
              compact
              value={heroBanner}
              onChange={setHeroBanner}
              uploadFn={uploadImage}
              maxFiles={1}
              hint="JPG/PNG · 16:9 · ≤2MB · ưu tiên 1920×1080"
            />
          </Field>
          <Field>
            <FieldLabel>Banner Hero — tiêu đề</FieldLabel>
            <Input defaultValue="Tuần Lễ Hàn — Sale tới 40%" />
          </Field>
          <Field>
            <FieldLabel>Banner Hero — phụ đề</FieldLabel>
            <Input defaultValue="Mì cay, mặt nạ, soju... freeship đơn từ 299k" />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field>
              <FieldLabel>CTA chính</FieldLabel>
              <Input defaultValue="Săn ngay" />
            </Field>
            <Field>
              <FieldLabel>Đường dẫn CTA</FieldLabel>
              <Input defaultValue="/products?category=K-Food" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Khối hiển thị</FieldLabel>
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
          <div className="grid grid-cols-2 gap-2.5">
            <Field>
              <FieldLabel>Số SP / mỗi khối</FieldLabel>
              <Select defaultValue="8">
                <SelectOption value="6">6 sản phẩm</SelectOption>
                <SelectOption value="8">8 sản phẩm</SelectOption>
                <SelectOption value="12">12 sản phẩm</SelectOption>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Sắp xếp mặc định</FieldLabel>
              <Select defaultValue="bestseller">
                <SelectOption value="bestseller">Bán chạy</SelectOption>
                <SelectOption value="newest">Mới nhất</SelectOption>
                <SelectOption value="price-asc">Giá tăng dần</SelectOption>
              </Select>
            </Field>
          </div>
          <Field>
            <FieldLabel>SEO — Tiêu đề trang chủ</FieldLabel>
            <Input defaultValue="Tiệm Korea — Cửa hàng tạp hoá Hàn Quốc tại Việt Nam" />
          </Field>
          <Field>
            <FieldLabel>SEO — Mô tả meta</FieldLabel>
            <Textarea
              defaultValue="Nhập khẩu chính hãng K-Food, K-Beauty, K-Drink. Freeship đơn từ 299k. Giao hàng 2H tại HCM, Hà Nội."
              rows={2}
            />
          </Field>
          <Button className="self-start">Lưu trang chủ</Button>
        </TabsContent>

        {/* Footer info */}
        <TabsContent value="footer" className={PANEL_CLS}>
          <Field>
            <FieldLabel>Tên công ty (footer)</FieldLabel>
            <Input defaultValue="Công ty TNHH Tiệm Korea Vietnam" />
          </Field>
          <Field>
            <FieldLabel>Mã số thuế</FieldLabel>
            <Input defaultValue="0312345678" />
          </Field>
          <Field>
            <FieldLabel>Địa chỉ đăng ký kinh doanh</FieldLabel>
            <Textarea
              defaultValue="123 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh"
              rows={2}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field>
              <FieldLabel>Hotline footer</FieldLabel>
              <Input defaultValue="1900 0099 (8h - 22h)" />
            </Field>
            <Field>
              <FieldLabel>Email CSKH</FieldLabel>
              <Input defaultValue="cskh@tiemkorea.vn" />
            </Field>
          </div>
          <Field>
            <FieldLabel>Giờ làm việc</FieldLabel>
            <Input defaultValue="Thứ 2 - Chủ nhật · 08:00 - 22:00" />
          </Field>
          <Field>
            <FieldLabel>Văn bản cuối footer (copyright)</FieldLabel>
            <Input defaultValue="© 2024 Tiệm Korea. All rights reserved." />
          </Field>
          <Field>
            <FieldLabel>Logo Bộ Công Thương đã đăng ký</FieldLabel>
            <FileUploader
              compact
              value={footerLogo}
              onChange={setFooterLogo}
              uploadFn={uploadImage}
              maxFiles={1}
              hint="PNG · ≤200KB"
            />
          </Field>
          <Button className="self-start">Lưu footer</Button>
        </TabsContent>

        {/* Social links */}
        <TabsContent value="social" className={PANEL_CLS}>
          <Field>
            <FieldLabel>Facebook</FieldLabel>
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
              <Input defaultValue="https://facebook.com/tiemkorea" />
            </div>
          </Field>
          <Field>
            <FieldLabel>Instagram</FieldLabel>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={2} />
              <Input defaultValue="https://instagram.com/tiemkorea" />
            </div>
          </Field>
          <Field>
            <FieldLabel>TikTok</FieldLabel>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
              <Input defaultValue="https://tiktok.com/@tiemkorea" />
            </div>
          </Field>
          <Field>
            <FieldLabel>YouTube</FieldLabel>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 shrink-0 text-red-600" strokeWidth={2} />
              <Input defaultValue="https://youtube.com/@tiemkorea" />
            </div>
          </Field>
          <Field>
            <FieldLabel>Zalo OA</FieldLabel>
            <Input defaultValue="https://zalo.me/tiemkorea" />
          </Field>
          <Button className="self-start">Lưu liên kết</Button>
        </TabsContent>

        {/* Contact widget */}
        <TabsContent value="contact-widget" className={PANEL_CLS}>
          <p className="text-[13px] text-muted-foreground">
            Cấu hình nút liên hệ nổi ở góc dưới phải cửa hàng. Để trống để ẩn tùy chọn đó.
          </p>
          <Field>
            <FieldLabel>Số điện thoại</FieldLabel>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
              <Input
                placeholder="VD: +84901234567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </Field>
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
