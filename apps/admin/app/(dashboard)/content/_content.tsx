"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { Facebook, Globe, Image as ImageIcon, Instagram, MapPin, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_FOOTER_CONFIG, type FooterConfig } from "@/lib/footer-config";
import { DEFAULT_SOCIAL_CONFIG, type SocialConfig } from "@/lib/social-config";

const SECTIONS = [
  { value: "footer", label: "Footer", icon: MapPin },
  { value: "social", label: "Mạng xã hội", icon: Globe },
] as const;

const PANEL_CLS = "m-0 flex flex-col gap-3.5 p-5";

export default function SettingsContent() {
  const queryClient = useQueryClient();

  const [footer, setFooter] = useState<FooterConfig>(DEFAULT_FOOTER_CONFIG);
  const [social, setSocial] = useState<SocialConfig>(DEFAULT_SOCIAL_CONFIG);

  const footerQuery = useQuery({
    queryKey: ["footer_config"],
    queryFn: () => fetch("/api/admin/settings/footer").then((r) => r.json()),
    staleTime: 60_000,
  });
  const socialQuery = useQuery({
    queryKey: ["social_config"],
    queryFn: () => fetch("/api/admin/settings/social").then((r) => r.json()),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (footerQuery.data) setFooter(footerQuery.data);
  }, [footerQuery.data]);

  useEffect(() => {
    if (socialQuery.data) setSocial(socialQuery.data);
  }, [socialQuery.data]);

  const saveFooter = useMutation({
    mutationFn: (data: FooterConfig) =>
      fetch("/api/admin/settings/footer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("save failed");
        return r.json();
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["footer_config"], saved);
      toast.success("Đã lưu footer");
    },
    onError: () => toast.error("Không thể lưu footer"),
  });

  const saveSocial = useMutation({
    mutationFn: (data: SocialConfig) =>
      fetch("/api/admin/settings/social", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("save failed");
        return r.json();
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["social_config"], saved);
      toast.success("Đã lưu liên kết mạng xã hội");
    },
    onError: () => toast.error("Không thể lưu liên kết"),
  });

  return (
    <Tabs defaultValue="footer" className="w-full gap-4">
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
        {/* Footer tab */}
        <TabsContent value="footer" className={PANEL_CLS}>
          <Field>
            <FieldLabel>Mô tả thương hiệu</FieldLabel>
            <Textarea
              value={footer.tagline}
              onChange={(e) => setFooter((f) => ({ ...f, tagline: e.target.value }))}
              rows={2}
            />
          </Field>
          <Field>
            <FieldLabel>Copyright</FieldLabel>
            <Input
              placeholder="VD: © 2024 K-SMART VN"
              value={footer.copyright}
              onChange={(e) => setFooter((f) => ({ ...f, copyright: e.target.value }))}
            />
          </Field>
          <Button
            className="self-start"
            onClick={() => saveFooter.mutate(footer)}
            disabled={saveFooter.isPending}
          >
            {saveFooter.isPending ? "Đang lưu..." : "Lưu footer"}
          </Button>
        </TabsContent>

        {/* Social tab */}
        <TabsContent value="social" className={PANEL_CLS}>
          <Field>
            <FieldLabel>Facebook</FieldLabel>
            <div className="flex items-center gap-2">
              <Facebook className="h-4 w-4 shrink-0 text-blue-600" strokeWidth={2} />
              <Input
                placeholder="https://facebook.com/..."
                value={social.facebook}
                onChange={(e) => setSocial((s) => ({ ...s, facebook: e.target.value }))}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>Instagram</FieldLabel>
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 shrink-0 text-pink-600" strokeWidth={2} />
              <Input
                placeholder="https://instagram.com/..."
                value={social.instagram}
                onChange={(e) => setSocial((s) => ({ ...s, instagram: e.target.value }))}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>TikTok</FieldLabel>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 shrink-0 text-foreground" strokeWidth={2} />
              <Input
                placeholder="https://tiktok.com/@..."
                value={social.tiktok}
                onChange={(e) => setSocial((s) => ({ ...s, tiktok: e.target.value }))}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>YouTube</FieldLabel>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 shrink-0 text-red-600" strokeWidth={2} />
              <Input
                placeholder="https://youtube.com/@..."
                value={social.youtube}
                onChange={(e) => setSocial((s) => ({ ...s, youtube: e.target.value }))}
              />
            </div>
          </Field>
          <Field>
            <FieldLabel>Zalo OA</FieldLabel>
            <Input
              placeholder="https://zalo.me/..."
              value={social.zalo}
              onChange={(e) => setSocial((s) => ({ ...s, zalo: e.target.value }))}
            />
          </Field>
          <Button
            className="self-start"
            onClick={() => saveSocial.mutate(social)}
            disabled={saveSocial.isPending}
          >
            {saveSocial.isPending ? "Đang lưu..." : "Lưu liên kết"}
          </Button>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
