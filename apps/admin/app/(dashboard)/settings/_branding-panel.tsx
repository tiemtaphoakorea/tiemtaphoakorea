"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { Button } from "@workspace/ui/components/button";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { FileUploader } from "@workspace/ui/components/file-uploader";
import { Input } from "@workspace/ui/components/input";
import { ImageIcon, Loader2, Wand2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import { resizeImageViaCanvas, uploadBlob } from "@/lib/resize-image-canvas";
import { uploadImage } from "@/lib/upload-image";
import { ColorPairPicker } from "./_color-pair-picker";

type BrandingConfig = {
  logoMainUrl: string;
  logoSquareUrl: string;
  logoAccent: string;
  brandColor: string;
  accentColor: string;
  faviconUrl: string;
  appleIconUrl: string;
  ogImageUrl: string;
};

const DEFAULT_BRAND_COLOR = "#6366F1";
const DEFAULT_ACCENT_COLOR = "#F59E0B";
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const LOGO_HINTS = {
  main: "PNG/SVG ngang · tối thiểu 200×60px · Hiển thị trên thanh điều hướng website.",
  square: "PNG vuông 512×512px · Dùng để tạo favicon, icon ứng dụng và Open Graph.",
  favicon: "PNG 32×32px · Hiện ở tab trình duyệt · Tự động tạo từ logo vuông.",
  apple: "PNG 180×180px · Icon khi thêm vào màn hình chính iOS.",
  og: "PNG/JPG 1200×630px · Hiện khi chia sẻ link lên Facebook, Zalo, Twitter.",
};

export function BrandingPanel() {
  const queryClient = useQueryClient();
  const [logoMain, setLogoMain] = useState<string[]>([]);
  const [logoSquare, setLogoSquare] = useState<string[]>([]);
  const [logoAccent, setLogoAccent] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT_COLOR);
  const [faviconUrl, setFaviconUrl] = useState<string[]>([]);
  const [appleIconUrl, setAppleIconUrl] = useState<string[]>([]);
  const [ogImageUrl, setOgImageUrl] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

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
    setBrandColor(cfg.brandColor || DEFAULT_BRAND_COLOR);
    setAccentColor(cfg.accentColor || DEFAULT_ACCENT_COLOR);
    setFaviconUrl(cfg.faviconUrl ? [cfg.faviconUrl] : []);
    setAppleIconUrl(cfg.appleIconUrl ? [cfg.appleIconUrl] : []);
    setOgImageUrl(cfg.ogImageUrl ? [cfg.ogImageUrl] : []);
  }, [brandingQuery.data]);

  async function handleGenerateVariants() {
    const src = logoSquare[0];
    if (!src) return;
    setGenerating(true);
    try {
      const [favBlob, appleBlob] = await Promise.all([
        resizeImageViaCanvas(src, 32, 32),
        resizeImageViaCanvas(src, 180, 180),
      ]);
      const [favUrl, appleUrl] = await Promise.all([
        uploadBlob(favBlob, "favicon-32x32.png"),
        uploadBlob(appleBlob, "apple-icon-180x180.png"),
      ]);
      setFaviconUrl([favUrl]);
      setAppleIconUrl([appleUrl]);
      toast.success("Đã tạo favicon và Apple icon từ logo vuông");
    } catch {
      toast.error("Không thể tạo biến thể ảnh. Kiểm tra lại logo vuông.");
    } finally {
      setGenerating(false);
    }
  }

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
        faviconUrl: faviconUrl[0] ?? "",
        appleIconUrl: appleIconUrl[0] ?? "",
        ogImageUrl: ogImageUrl[0] ?? "",
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left: primary logo uploads + OG + accent */}
        <div className="flex flex-col gap-3.5 lg:flex-1">
          <div className="grid grid-cols-3 gap-2.5">
            <Field className="col-span-2">
              <FieldLabel>Logo chính (ngang)</FieldLabel>
              <FileUploader
                compact
                value={logoMain}
                onChange={setLogoMain}
                uploadFn={uploadImage}
                maxFiles={1}
                hint="PNG/SVG · 1:3 · ≤500KB"
              />
              <p className="text-[11px] text-muted-foreground">{LOGO_HINTS.main}</p>
            </Field>
            <Field>
              <FieldLabel>Logo vuông</FieldLabel>
              <FileUploader
                compact
                value={logoSquare}
                onChange={setLogoSquare}
                uploadFn={uploadImage}
                maxFiles={1}
                hint="PNG/SVG · 1:1 · ≤200KB"
              />
              <p className="text-[11px] text-muted-foreground">{LOGO_HINTS.square}</p>
            </Field>
          </div>

          <Field>
            <FieldLabel>Logo accent (chữ phụ trên logo)</FieldLabel>
            <Input value={logoAccent} onChange={(e) => setLogoAccent(e.target.value)} />
          </Field>

          <Field>
            <FieldLabel>Ảnh Open Graph (OG Image)</FieldLabel>
            <FileUploader
              compact
              value={ogImageUrl}
              onChange={setOgImageUrl}
              uploadFn={uploadImage}
              maxFiles={1}
              hint="PNG/JPG · 1200×630px · ≤1MB"
            />
            <p className="text-[11px] text-muted-foreground">{LOGO_HINTS.og}</p>
          </Field>
        </div>

        {/* Right: brand colors + icon variants */}
        <div className="flex flex-col gap-3 lg:flex-1">
          <ColorPairPicker
            brandColor={brandColor}
            accentColor={accentColor}
            onBrandChange={setBrandColor}
            onAccentChange={setAccentColor}
          />

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>Biến thể icon</FieldLabel>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateVariants}
                disabled={!logoSquare[0] || generating}
                className="gap-1 text-[11px] h-7 px-2"
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Wand2 className="h-3 w-3" />
                )}
                {generating ? "Đang tạo..." : "Tạo"}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Resize từ logo vuông</p>
            <div className="grid grid-cols-2 gap-2">
              <Field>
                <FieldLabel className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Favicon 32px
                </FieldLabel>
                <FileUploader
                  compact
                  value={faviconUrl}
                  onChange={setFaviconUrl}
                  uploadFn={uploadImage}
                  maxFiles={1}
                  hint="PNG · 32px"
                />
                {faviconUrl[0] && (
                  <div className="flex items-center gap-1">
                    <Image
                      src={faviconUrl[0]}
                      alt="Favicon preview"
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded object-contain border border-border"
                    />
                    <span className="text-[10px] text-muted-foreground">32px</span>
                  </div>
                )}
              </Field>
              <Field>
                <FieldLabel className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" /> Apple 180px
                </FieldLabel>
                <FileUploader
                  compact
                  value={appleIconUrl}
                  onChange={setAppleIconUrl}
                  uploadFn={uploadImage}
                  maxFiles={1}
                  hint="PNG · 180px"
                />
                {appleIconUrl[0] && (
                  <div className="flex items-center gap-1">
                    <Image
                      src={appleIconUrl[0]}
                      alt="Apple icon preview"
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded object-contain border border-border"
                    />
                    <span className="text-[10px] text-muted-foreground">180px</span>
                  </div>
                )}
              </Field>
            </div>
          </Field>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || brandingQuery.isLoading}
        >
          {saveMutation.isPending ? "Đang lưu..." : "Lưu nhận diện"}
        </Button>
      </div>
    </div>
  );
}
