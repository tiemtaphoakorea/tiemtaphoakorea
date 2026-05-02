"use client";

import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { FileUploader } from "@workspace/ui/components/file-uploader";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { Building2, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearShopInfoCache } from "@/lib/print-invoice";
import { uploadImage } from "@/lib/upload-image";

const SECTIONS = [
  { value: "store", label: "Cửa hàng", icon: Building2 },
  { value: "branding", label: "Nhận diện", icon: Palette },
] as const;

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

export default function AdminSettings() {
  const [logoMain, setLogoMain] = useState<string[]>([]);
  const [logoSquare, setLogoSquare] = useState<string[]>([]);
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [shopSaving, setShopSaving] = useState(false);

  useEffect(() => {
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
      </Card>
    </Tabs>
  );
}
