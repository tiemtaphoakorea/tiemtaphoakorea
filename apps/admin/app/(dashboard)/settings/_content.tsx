"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { Building2, Palette, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { clearShopInfoCache } from "@/lib/print-invoice";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { BrandingPanel } from "./_branding-panel";

const SECTIONS = [
  { value: "store", label: "Cửa hàng", icon: Building2 },
  { value: "branding", label: "Nhận diện", icon: Palette },
  { value: "customers", label: "Hạng khách hàng", icon: Users },
] as const;

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

const SEO_DESCRIPTION_MAX = 160;

export default function AdminSettings() {
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [shopPhone, setShopPhone] = useState("");
  const [shopTaxId, setShopTaxId] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [shopSaving, setShopSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings/shop-info")
      .then((r) => r.json())
      .then((data) => {
        setShopName(data.name ?? "");
        setShopAddress(data.address ?? "");
        setShopPhone(data.phone ?? "");
        setShopTaxId(data.taxId ?? "");
        setSeoDescription(data.seoDescription ?? "");
        setSeoKeywords(data.seoKeywords ?? "");
      })
      .catch(() => {});
  }, []);

  async function saveShopInfo() {
    if (!shopName.trim()) {
      toast.error("Tên cửa hàng không được để trống");
      return;
    }
    setShopSaving(true);
    try {
      const res = await fetch("/api/admin/settings/shop-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: shopName.trim(),
          address: shopAddress,
          phone: shopPhone,
          taxId: shopTaxId,
          seoDescription: seoDescription.slice(0, SEO_DESCRIPTION_MAX),
          seoKeywords,
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

          <div className="border-t border-border pt-3">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
              SEO
            </p>
            <div className="flex flex-col gap-2.5">
              <Field>
                <div className="flex items-baseline justify-between">
                  <FieldLabel>Mô tả website (meta description)</FieldLabel>
                  <span
                    className={`text-[11px] ${seoDescription.length > SEO_DESCRIPTION_MAX - 10 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {seoDescription.length}/{SEO_DESCRIPTION_MAX}
                  </span>
                </div>
                <Textarea
                  placeholder="Mô tả ngắn về cửa hàng, hiển thị trên Google Search..."
                  rows={2}
                  maxLength={SEO_DESCRIPTION_MAX}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Tối đa 160 ký tự. Mô tả hấp dẫn giúp tăng tỉ lệ click từ kết quả tìm kiếm.
                </p>
              </Field>
              <Field>
                <FieldLabel>Từ khóa SEO (keywords)</FieldLabel>
                <Input
                  placeholder="VD: mỹ phẩm korea, skincare, chăm sóc da"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Phân cách bằng dấu phẩy. Hỗ trợ tìm kiếm nội bộ và một số công cụ tìm kiếm.
                </p>
              </Field>
            </div>
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
      if (data.loyalMinOrders < 1 || data.frequentMinOrders < 1) {
        throw new Error("Số đơn tối thiểu phải ≥ 1");
      }
      if (data.loyalMinSpent < 0 || data.frequentMinSpent < 0) {
        throw new Error("Tổng chi tiêu tối thiểu phải ≥ 0");
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
