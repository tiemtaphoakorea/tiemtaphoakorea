"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { FileUploader } from "@workspace/ui/components/file-uploader";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { Building2, Palette, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearShopInfoCache } from "@/lib/print-invoice";
import { queryKeys } from "@/lib/query-keys";
import { uploadImage } from "@/lib/upload-image";
import { adminClient } from "@/services/admin.client";

const SECTIONS = [
  { value: "store", label: "Cửa hàng", icon: Building2 },
  { value: "branding", label: "Nhận diện", icon: Palette },
  { value: "customers", label: "Hạng khách hàng", icon: Users },
] as const;

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

type BrandingConfig = {
  logoMainUrl: string;
  logoSquareUrl: string;
  logoAccent: string;
  brandColor: string;
  accentColor: string;
};

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export default function AdminSettings() {
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
          <BrandingPanel />
        </TabsContent>

        <TabsContent value="customers" className={PANEL_CLS}>
          <CustomerTierPanel />
        </TabsContent>
      </Card>
    </Tabs>
  );
}

function BrandingPanel() {
  const queryClient = useQueryClient();
  const [logoMain, setLogoMain] = useState<string[]>([]);
  const [logoSquare, setLogoSquare] = useState<string[]>([]);
  const [logoAccent, setLogoAccent] = useState("");
  const [brandColor, setBrandColor] = useState("#6366F1");
  const [accentColor, setAccentColor] = useState("#F59E0B");

  const brandingQuery = useQuery({
    queryKey: queryKeys.settings.branding,
    queryFn: async () => {
      const res = await fetch(API_ENDPOINTS.ADMIN.SETTINGS_BRANDING);
      if (!res.ok) throw new Error("load failed");
      return (await res.json()) as BrandingConfig;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    const cfg = brandingQuery.data;
    if (!cfg) return;
    setLogoMain(cfg.logoMainUrl ? [cfg.logoMainUrl] : []);
    setLogoSquare(cfg.logoSquareUrl ? [cfg.logoSquareUrl] : []);
    setLogoAccent(cfg.logoAccent ?? "");
    setBrandColor(cfg.brandColor || "#6366F1");
    setAccentColor(cfg.accentColor || "#F59E0B");
  }, [brandingQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!HEX_PATTERN.test(brandColor) || !HEX_PATTERN.test(accentColor)) {
        throw new Error("Mã màu HEX không hợp lệ");
      }
      const payload: BrandingConfig = {
        logoMainUrl: logoMain[0] ?? "",
        logoSquareUrl: logoSquare[0] ?? "",
        logoAccent: logoAccent.trim(),
        brandColor,
        accentColor,
      };
      const res = await fetch(API_ENDPOINTS.ADMIN.SETTINGS_BRANDING, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      return (await res.json()) as BrandingConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.branding });
      toast.success("Đã lưu nhận diện thương hiệu");
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể lưu nhận diện");
    },
  });

  return (
    <>
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
        <Input value={logoAccent} onChange={(e) => setLogoAccent(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field>
          <FieldLabel>Màu thương hiệu</FieldLabel>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
            <span
              className="inline-block h-5 w-5 rounded-md"
              style={{ backgroundColor: brandColor }}
            />
            <Input
              className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
            />
          </div>
        </Field>
        <Field>
          <FieldLabel>Màu nhấn (accent)</FieldLabel>
          <div className="flex h-9 items-center gap-2 rounded-lg border border-border px-3">
            <span
              className="inline-block h-5 w-5 rounded-md"
              style={{ backgroundColor: accentColor }}
            />
            <Input
              className="h-7 border-0 px-1 font-mono text-xs shadow-none focus-visible:ring-0"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </div>
        </Field>
      </div>
      <Button
        className="self-start"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || brandingQuery.isLoading}
      >
        {saveMutation.isPending ? "Đang lưu..." : "Lưu nhận diện"}
      </Button>
    </>
  );
}

function CustomerTierPanel() {
  const queryClient = useQueryClient();
  const [loyalMinOrders, setLoyalMinOrders] = useState("10");
  const [loyalMinSpent, setLoyalMinSpent] = useState("5000000");
  const [frequentMinOrders, setFrequentMinOrders] = useState("5");
  const [frequentMinSpent, setFrequentMinSpent] = useState("2000000");

  const tierQuery = useQuery({
    queryKey: queryKeys.customers.tierConfig,
    queryFn: async () => await adminClient.getCustomerTierConfig(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const cfg = tierQuery.data;
    if (!cfg) return;
    setLoyalMinOrders(String(cfg.loyalMinOrders));
    setLoyalMinSpent(String(cfg.loyalMinSpent));
    setFrequentMinOrders(String(cfg.frequentMinOrders));
    setFrequentMinSpent(String(cfg.frequentMinSpent));
  }, [tierQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        loyalMinOrders: Number(loyalMinOrders),
        loyalMinSpent: Number(loyalMinSpent),
        frequentMinOrders: Number(frequentMinOrders),
        frequentMinSpent: Number(frequentMinSpent),
      };
      if (
        !Number.isFinite(data.loyalMinOrders) ||
        !Number.isFinite(data.loyalMinSpent) ||
        !Number.isFinite(data.frequentMinOrders) ||
        !Number.isFinite(data.frequentMinSpent)
      ) {
        throw new Error("Các giá trị phải là số hợp lệ");
      }
      return await adminClient.updateCustomerTierConfig(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.tierConfig });
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success("Đã lưu cấu hình hạng khách hàng");
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || "Không thể lưu cấu hình");
    },
  });

  return (
    <>
      <p className="text-[13px] text-muted-foreground">
        Ngưỡng tự động phân hạng khách hàng dựa trên số đơn và tổng chi tiêu.
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field>
          <FieldLabel>Khách thân thiết - Số đơn tối thiểu</FieldLabel>
          <Input
            type="number"
            min={0}
            value={loyalMinOrders}
            onChange={(e) => setLoyalMinOrders(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Khách thân thiết - Tổng chi tiêu tối thiểu (VNĐ)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={loyalMinSpent}
            onChange={(e) => setLoyalMinSpent(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Khách thường xuyên - Số đơn tối thiểu</FieldLabel>
          <Input
            type="number"
            min={0}
            value={frequentMinOrders}
            onChange={(e) => setFrequentMinOrders(e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>Khách thường xuyên - Tổng chi tiêu tối thiểu (VNĐ)</FieldLabel>
          <Input
            type="number"
            min={0}
            value={frequentMinSpent}
            onChange={(e) => setFrequentMinSpent(e.target.value)}
          />
        </Field>
      </div>
      <Button
        className="self-start"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || tierQuery.isLoading}
      >
        {saveMutation.isPending ? "Đang lưu..." : "Lưu hạng khách hàng"}
      </Button>
    </>
  );
}
