"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Field, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { Image, Layout, Plus, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_HOMEPAGE_CONFIG, HOMEPAGE_SETTING_KEY, type HomepageConfig } from "@/lib/homepage-config";
import { queryKeys } from "@/lib/query-keys";
import { adminClient } from "@/services/admin.client";
import { BannerFormPanel } from "./_components/banner-form-panel";
import { BannerList } from "./_components/banner-list";
import { CollectionFormPanel } from "./_components/collection-form-panel";
import { CollectionList } from "./_components/collection-list";

export default function HomepageContent() {
  const queryClient = useQueryClient();

  // Collections state
  const [editingCollectionId, setEditingCollectionId] = useState<string | null | undefined>(undefined);
  const collectionsQuery = useQuery({
    queryKey: queryKeys.homepageCollections.list,
    queryFn: () => adminClient.listHomepageCollections(),
    staleTime: 30_000,
  });
  const collections = collectionsQuery.data?.collections ?? [];

  // Banners state
  const [editingBannerId, setEditingBannerId] = useState<string | null | undefined>(undefined);
  const bannersQuery = useQuery({
    queryKey: queryKeys.banners.list,
    queryFn: () => adminClient.listBanners(),
    staleTime: 30_000,
  });
  const banners = bannersQuery.data?.banners ?? [];

  // Settings state
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
  const settingsQuery = useQuery({
    queryKey: [HOMEPAGE_SETTING_KEY],
    queryFn: () => fetch("/api/admin/settings/homepage").then((r) => r.json()),
    staleTime: 60_000,
  });
  useEffect(() => {
    if (settingsQuery.data) setConfig(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (data: HomepageConfig) =>
      fetch("/api/admin/settings/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => {
        if (!r.ok) throw new Error("save failed");
        return r.json();
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData([HOMEPAGE_SETTING_KEY], saved);
      toast.success("Đã lưu cài đặt trang chủ");
    },
    onError: () => toast.error("Không thể lưu cài đặt"),
  });

  return (
    <Tabs defaultValue="collections" className="w-full gap-4">
      <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto px-0">
        <TabsTrigger value="collections" className="gap-1.5 px-3 py-2.5 text-[13px] font-semibold">
          <Layout className="size-4" strokeWidth={2} />
          Collections
        </TabsTrigger>
        <TabsTrigger value="banners" className="gap-1.5 px-3 py-2.5 text-[13px] font-semibold">
          <Image className="size-4" strokeWidth={2} />
          Banners
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1.5 px-3 py-2.5 text-[13px] font-semibold">
          <Settings2 className="size-4" strokeWidth={2} />
          Cài đặt
        </TabsTrigger>
      </TabsList>

      {/* ── Collections tab ── */}
      <TabsContent value="collections" className="mt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {collectionsQuery.isLoading ? "Đang tải..." : `${collections.length} collections`}
          </span>
          <Button
            className="h-[34px] gap-1.5"
            onClick={() => setEditingCollectionId(null)}
            disabled={editingCollectionId === null}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tạo collection
          </Button>
        </div>

        {editingCollectionId === null && (
          <div className="overflow-hidden rounded-lg border border-primary bg-white shadow-sm">
            <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">
              Tạo collection mới
            </div>
            <CollectionFormPanel collectionId={null} onClose={() => setEditingCollectionId(undefined)} />
          </div>
        )}

        <CollectionList
          collections={collections}
          isLoading={collectionsQuery.isLoading}
          editingId={editingCollectionId}
          onEdit={(id) => setEditingCollectionId(id)}
          onCloseEdit={() => setEditingCollectionId(undefined)}
        />
      </TabsContent>

      {/* ── Banners tab ── */}
      <TabsContent value="banners" className="mt-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {bannersQuery.isLoading ? "Đang tải..." : `${banners.length} banners`}
          </span>
          <Button
            className="h-[34px] gap-1.5"
            onClick={() => setEditingBannerId(null)}
            disabled={editingBannerId === null}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Tạo banner
          </Button>
        </div>

        {editingBannerId === null && (
          <div className="overflow-hidden rounded-lg border border-primary bg-white shadow-sm">
            <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">
              Tạo banner mới
            </div>
            <BannerFormPanel bannerId={null} onClose={() => setEditingBannerId(undefined)} />
          </div>
        )}

        <BannerList
          banners={banners}
          isLoading={bannersQuery.isLoading}
          editingId={editingBannerId}
          onEdit={(id) => setEditingBannerId(id)}
          onCloseEdit={() => setEditingBannerId(undefined)}
        />
      </TabsContent>

      {/* ── Settings tab ── */}
      <TabsContent value="settings" className="mt-0">
        <Card className="gap-0 overflow-hidden border border-border p-0 shadow-none">
          <div className="flex flex-col gap-3.5 p-5">
            <Field>
              <FieldLabel>SEO — Tiêu đề trang chủ</FieldLabel>
              <Input
                value={config.seo.title}
                onChange={(e) => setConfig((c) => ({ ...c, seo: { ...c.seo, title: e.target.value } }))}
              />
            </Field>
            <Field>
              <FieldLabel>SEO — Mô tả meta</FieldLabel>
              <Textarea
                value={config.seo.description}
                onChange={(e) => setConfig((c) => ({ ...c, seo: { ...c.seo, description: e.target.value } }))}
                rows={2}
              />
            </Field>

            <Button
              className="self-start"
              onClick={() => saveMutation.mutate(config)}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Đang lưu..." : "Lưu cài đặt trang chủ"}
            </Button>
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
