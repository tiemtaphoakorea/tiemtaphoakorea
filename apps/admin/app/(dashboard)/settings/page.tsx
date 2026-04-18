"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Switch } from "@workspace/ui/components/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import {
  Calendar,
  Edit2,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  MoreHorizontal,
  Navigation,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BannerForm } from "@/components/admin/banners/banner-form";
import { queryKeys } from "@/lib/query-keys";

// ── Types ──────────────────────────────────────────────────────────────────────

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  showInNav: boolean;
  displayOrder: number;
  children?: CategoryRow[];
};

type CategoryOption = { id: string; name: string; slug: string };

type BannerRow = {
  id: string;
  type: string;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  categoryImageUrl: string | null;
  title: string | null;
  subtitle: string | null;
  badgeText: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ctaSecondaryLabel: string | null;
  discountTag: string | null;
  discountTagSub: string | null;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getBannerStatus(banner: BannerRow): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const now = new Date();
  if (!banner.isActive) return { label: "Ẩn", variant: "secondary" };
  if (banner.startsAt && new Date(banner.startsAt) > now)
    return { label: "Lên lịch", variant: "outline" };
  if (banner.endsAt && new Date(banner.endsAt) < now)
    return { label: "Hết hạn", variant: "destructive" };
  return { label: "Đang chạy", variant: "default" };
}

// ── Nav Categories Section ─────────────────────────────────────────────────────

function NavCategoriesSection() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async () => {
      const res = await axios.get<{ categories: CategoryRow[]; flatCategories: CategoryRow[] }>(
        API_ENDPOINTS.ADMIN.CATEGORIES,
      );
      return res as unknown as { categories: CategoryRow[]; flatCategories: CategoryRow[] };
    },
    enabled: typeof window !== "undefined",
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, showInNav }: { id: string; showInNav: boolean }) => {
      await axios.patch(API_ENDPOINTS.ADMIN.CATEGORY_DETAIL(id), { showInNav });
    },
    onMutate: async ({ id, showInNav }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previous = queryClient.getQueryData(queryKeys.categories.all);
      queryClient.setQueryData(
        queryKeys.categories.all,
        (old: { categories: CategoryRow[]; flatCategories: CategoryRow[] } | undefined) => {
          if (!old) return old;
          const patch = (cats: CategoryRow[]): CategoryRow[] =>
            cats.map((c) => ({
              ...c,
              showInNav: c.id === id ? showInNav : c.showInNav,
              children: c.children ? patch(c.children) : c.children,
            }));
          return {
            ...old,
            categories: patch(old.categories),
            flatCategories: old.flatCategories.map((c) => (c.id === id ? { ...c, showInNav } : c)),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.categories.all, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });

  const rootCategories = data?.categories ?? [];
  const navCount = data?.flatCategories.filter((c) => c.showInNav && c.isActive).length ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border border-border p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-center gap-2">
        <Eye className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Đang hiển thị <span className="font-bold text-foreground">{navCount}</span> danh mục trên
          thanh điều hướng
        </span>
      </div>

      {rootCategories.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Chưa có danh mục nào. Hãy tạo danh mục trước.
        </p>
      )}

      {rootCategories.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{cat.name}</p>
              {cat.children && cat.children.length > 0 && (
                <p className="text-xs text-muted-foreground">{cat.children.length} danh mục con</p>
              )}
            </div>
            {!cat.isActive && (
              <Badge variant="secondary" className="ml-1 shrink-0 text-[10px]">
                Ẩn
              </Badge>
            )}
          </div>
          <Switch
            checked={cat.showInNav}
            disabled={!cat.isActive || toggleMutation.isPending}
            onCheckedChange={(checked) => toggleMutation.mutate({ id: cat.id, showInNav: checked })}
            aria-label={`Hiển thị "${cat.name}" trên thanh điều hướng`}
          />
        </div>
      ))}
    </div>
  );
}

// ── Banners Section ────────────────────────────────────────────────────────────

function BannersSection({ categories }: { categories: CategoryOption[] }) {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.banners.all,
    queryFn: async () => {
      const res = await axios.get<{ banners: BannerRow[] }>(API_ENDPOINTS.ADMIN.BANNERS);
      return (res as unknown as { banners: BannerRow[] }).banners;
    },
    enabled: typeof window !== "undefined",
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      axios.patch(API_ENDPOINTS.ADMIN.BANNER_DETAIL(id), { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.banners.all }),
  });

  const deleteBanner = useMutation({
    mutationFn: (id: string) => axios.delete(API_ENDPOINTS.ADMIN.BANNER_DETAIL(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.banners.all }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data?.length ?? 0} banner · slide theo thứ tự <code className="text-xs">sortOrder</code>
        </p>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          size="sm"
          className="font-bold"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Thêm banner
        </Button>
      </div>

      {data?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12">
          <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-bold text-muted-foreground">Chưa có banner nào</p>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            variant="outline"
            size="sm"
            className="mt-3 font-bold"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Thêm banner đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.map((banner) => {
            const status = getBannerStatus(banner);
            const displayTitle =
              banner.title ?? (banner.categoryName ? `📂 ${banner.categoryName}` : "—");
            return (
              <Card key={banner.id} className="overflow-hidden rounded-xl border shadow-sm">
                <div className="relative h-36 bg-muted">
                  {(banner.imageUrl ?? banner.categoryImageUrl) ? (
                    <Image
                      src={(banner.imageUrl ?? banner.categoryImageUrl)!}
                      alt={displayTitle}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      {banner.type === "category" ? (
                        <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-bold text-white">{displayTitle}</p>
                    <Badge variant={status.variant} className="shrink-0 text-[10px]">
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {banner.type === "category" ? (
                      <span className="flex items-center gap-1">
                        <FolderOpen className="h-3.5 w-3.5" /> Danh mục
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3.5 w-3.5" /> Tùy chọn
                      </span>
                    )}
                    {banner.startsAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(banner.startsAt).toLocaleDateString("vi")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={(v) => toggleActive.mutate({ id: banner.id, isActive: v })}
                      className="scale-75"
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-xl">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(banner);
                            setFormOpen(true);
                          }}
                          className="font-bold"
                        >
                          <Edit2 className="mr-2 h-4 w-4" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm("Xoá banner này?")) deleteBanner.mutate(banner.id);
                          }}
                          className="font-bold text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Xoá
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BannerForm
        isOpen={formOpen}
        onOpenChange={setFormOpen}
        banner={editing}
        categories={categories}
      />
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: categoriesData } = useQuery({
    queryKey: ["categories-flat"],
    queryFn: async () => {
      const res = await axios.get<{ flatCategories: CategoryOption[] }>(
        `${API_ENDPOINTS.ADMIN.CATEGORIES}?flat=true`,
      );
      // The axios interceptor unwraps response.data, so res is already the payload.
      return (res as unknown as { flatCategories: CategoryOption[] }).flatCategories ?? [];
    },
    staleTime: 2 * 60 * 1000,
    enabled: typeof window !== "undefined",
  });

  const categories: CategoryOption[] = categoriesData ?? [];

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý hiển thị trang chủ, banner carousel và điều hướng.
        </p>
      </div>

      <Tabs defaultValue="nav">
        <TabsList className="h-10 rounded-xl bg-muted">
          <TabsTrigger value="nav" className="rounded-lg px-4 font-bold text-xs">
            <Navigation className="mr-1.5 h-3.5 w-3.5" /> Điều hướng
          </TabsTrigger>
          <TabsTrigger value="banners" className="rounded-lg px-4 font-bold text-xs">
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Banner slides
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Nav */}
        <TabsContent value="nav" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Navigation className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Thanh điều hướng</CardTitle>
                  <CardDescription className="text-xs">
                    Chọn danh mục hiển thị dưới dạng pill links trên thanh nav.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NavCategoriesSection />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Banner slides */}
        <TabsContent value="banners" className="mt-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Banner trang chủ</CardTitle>
                  <CardDescription className="text-xs">
                    Carousel slides hiển thị ở khu vực hero. Hỗ trợ slide từ danh mục hoặc ảnh tùy
                    chọn.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BannersSection categories={categories} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
