"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { NumberInput } from "@repo/ui/components/number-input";
import { PaginationControls } from "@repo/ui/components/pagination-controls";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Separator } from "@repo/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/sheet";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { Textarea } from "@repo/ui/components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import {
  AlertCircle,
  Bell,
  Check,
  ChevronRight,
  Copy,
  Github,
  Home,
  Info,
  LogOut,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";

// ─────────────────────────────────────────────────────
// Design Token Data
// ─────────────────────────────────────────────────────

const colorTokens = [
  {
    group: "Core",
    tokens: [
      {
        name: "--background",
        light: "hsl(210 40% 98%)",
        dark: "oklch(0.15 0.02 260)",
        tailwind: "bg-background",
        desc: "Page background",
        swatch: "#f8fafc",
      },
      {
        name: "--foreground",
        light: "hsl(222 47% 11%)",
        dark: "oklch(0.98 0.01 260)",
        tailwind: "text-foreground",
        desc: "Body text",
        swatch: "#0f172a",
      },
      {
        name: "--card",
        light: "hsl(0 0% 100%)",
        dark: "oklch(0.18 0.02 260)",
        tailwind: "bg-card",
        desc: "Card surfaces",
        swatch: "#ffffff",
      },
    ],
  },
  {
    group: "Brand",
    tokens: [
      {
        name: "--primary",
        light: "hsl(222 47% 11%)",
        dark: "oklch(0.7 0.12 180)",
        tailwind: "bg-primary",
        desc: "Primary CTA",
        swatch: "#0f172a",
      },
      {
        name: "--primary-foreground",
        light: "hsl(210 40% 98%)",
        dark: "oklch(0.15 0.02 180)",
        tailwind: "text-primary-foreground",
        desc: "Text on primary",
        swatch: "#f8fafc",
      },
      {
        name: "--secondary",
        light: "hsl(0 0% 100%)",
        dark: "oklch(0.25 0.03 180)",
        tailwind: "bg-secondary",
        desc: "Secondary buttons",
        swatch: "#ffffff",
      },
    ],
  },
  {
    group: "Neutral",
    tokens: [
      {
        name: "--muted",
        light: "hsl(210 40% 96.1%)",
        dark: "oklch(0.22 0.02 260)",
        tailwind: "bg-muted",
        desc: "Muted backgrounds",
        swatch: "#f1f5f9",
      },
      {
        name: "--muted-foreground",
        light: "hsl(215 16% 47%)",
        dark: "oklch(0.6 0.02 260)",
        tailwind: "text-muted-foreground",
        desc: "Supporting text",
        swatch: "#64748b",
      },
      {
        name: "--accent",
        light: "hsl(210 40% 96.1%)",
        dark: "oklch(0.2 0.02 190)",
        tailwind: "bg-accent",
        desc: "Hover states",
        swatch: "#f1f5f9",
      },
    ],
  },
  {
    group: "Semantic",
    tokens: [
      {
        name: "--destructive",
        light: "hsl(0 84.2% 60.2%)",
        dark: "oklch(0.5 0.18 25)",
        tailwind: "bg-destructive",
        desc: "Errors, delete",
        swatch: "#ef4444",
      },
      {
        name: "--border",
        light: "hsl(214.3 31.8% 91.4%)",
        dark: "oklch(0.3 0.02 190)",
        tailwind: "border-border",
        desc: "Dividers",
        swatch: "#e2e8f0",
      },
      {
        name: "--ring",
        light: "hsl(222 47% 11%)",
        dark: "oklch(0.55 0.15 190)",
        tailwind: "ring-ring",
        desc: "Focus rings",
        swatch: "#0f172a",
      },
    ],
  },
];

const statusColors = [
  { label: "Success", bg: "#ecfdf5", text: "#059669", border: "#a7f3d0", name: "Emerald" },
  { label: "Warning", bg: "#fffbeb", text: "#d97706", border: "#fde68a", name: "Amber" },
  { label: "Info", bg: "#eff6ff", text: "#2563eb", border: "#bfdbfe", name: "Blue" },
  { label: "Neutral", bg: "#f9fafb", text: "#4b5563", border: "#e5e7eb", name: "Gray" },
  { label: "Error", bg: "#fef2f2", text: "#dc2626", border: "#fecaca", name: "Red" },
  { label: "Purple", bg: "#faf5ff", text: "#7c3aed", border: "#ddd6fe", name: "Violet" },
];

const chartColors = [
  { token: "--chart-1", value: "hsl(222 47% 11%)", swatch: "#0f172a", name: "Slate 900" },
  { token: "--chart-2", value: "hsl(215 16% 47%)", swatch: "#64748b", name: "Slate 600" },
  { token: "--chart-3", value: "hsl(215 25% 27%)", swatch: "#334155", name: "Slate 800" },
  { token: "--chart-4", value: "hsl(214 32% 91%)", swatch: "#e2e8f0", name: "Slate 200" },
  { token: "--chart-5", value: "hsl(210 40% 96%)", swatch: "#f1f5f9", name: "Slate 100" },
];

const typeScale = [
  { class: "text-xs", size: "12px", lh: "16px", weight: "400", usage: "Captions, badge text" },
  { class: "text-sm", size: "14px", lh: "20px", weight: "400", usage: "Body small, table data" },
  { class: "text-base", size: "16px", lh: "24px", weight: "400", usage: "Body copy, inputs" },
  { class: "text-lg", size: "18px", lh: "28px", weight: "600", usage: "Subheadings" },
  { class: "text-xl", size: "20px", lh: "28px", weight: "600", usage: "Card titles" },
  { class: "text-2xl", size: "24px", lh: "32px", weight: "700", usage: "Section headings" },
  { class: "text-3xl", size: "30px", lh: "36px", weight: "700", usage: "Page titles" },
  { class: "text-4xl", size: "36px", lh: "40px", weight: "800", usage: "Hero headings" },
];

const radiusTokens = [
  { name: "--radius-sm", tailwind: "rounded-sm", computed: "4px", usage: "Checkboxes, small tags" },
  { name: "--radius-md", tailwind: "rounded-md", computed: "6px", usage: "Buttons, inputs" },
  { name: "--radius-lg", tailwind: "rounded-lg", computed: "8px", usage: "Default radius" },
  { name: "--radius-xl", tailwind: "rounded-xl", computed: "12px", usage: "Cards, popovers" },
  {
    name: "--radius-2xl",
    tailwind: "rounded-2xl",
    computed: "16px",
    usage: "Large cards, modals",
  },
  {
    name: "--radius-4xl",
    tailwind: "rounded-4xl",
    computed: "24px",
    usage: "Pill-style elements",
  },
  { name: "N/A", tailwind: "rounded-full", computed: "9999px", usage: "Avatars, badges" },
];

const spacingTokens = [
  { class: "p-1", value: "4px", desc: "Micro gaps" },
  { class: "p-2", value: "8px", desc: "Icon spacing" },
  { class: "p-3", value: "12px", desc: "Compact padding" },
  { class: "p-4", value: "16px", desc: "Default padding" },
  { class: "p-5", value: "20px", desc: "Medium padding" },
  { class: "p-6", value: "24px", desc: "Card padding" },
  { class: "p-8", value: "32px", desc: "Section padding" },
  { class: "p-12", value: "48px", desc: "Large sections" },
  { class: "p-16", value: "64px", desc: "Major sections" },
];

// ─────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────

const navSections = [
  { id: "colors", label: "Colors", group: "Foundation" },
  { id: "typography", label: "Typography", group: "Foundation" },
  { id: "spacing", label: "Spacing", group: "Foundation" },
  { id: "radius", label: "Border Radius", group: "Foundation" },
  { id: "effects", label: "Shadows & Effects", group: "Foundation" },
  { id: "buttons", label: "Buttons", group: "Components" },
  { id: "badges", label: "Badges", group: "Components" },
  { id: "cards", label: "Cards", group: "Components" },
  { id: "forms", label: "Forms", group: "Components" },
  { id: "navigation", label: "Navigation", group: "Components" },
  { id: "data-display", label: "Data Display", group: "Components" },
  { id: "overlays", label: "Overlays", group: "Components" },
  { id: "command", label: "Command", group: "Components" },
  { id: "sheet", label: "Sheet", group: "Components" },
  { id: "number-input", label: "Number Input", group: "Components" },
  { id: "pagination", label: "Pagination", group: "Components" },
];

function SectionHeader({
  num,
  id,
  title,
  desc,
}: {
  num: string;
  id: string;
  title: string;
  desc: string;
}) {
  return (
    <div id={id} className="mb-6 scroll-mt-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-medium text-slate-400">{num}</span>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
      <p className="mt-1 ml-9 text-sm text-slate-500">{desc}</p>
      <Separator className="mt-4" />
    </div>
  );
}

function TokenPill({ value }: { value: string }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">
      {value}
    </code>
  );
}

function ShowcaseBox({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="border-b border-slate-100 px-4 py-2.5">
        <span className="font-mono text-xs font-medium text-slate-500">{title}</span>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [switchA, setSwitchA] = useState(true);
  const [switchB, setSwitchB] = useState(false);
  const [radio, setRadio] = useState("option-a");
  const [page, setPage] = useState(3);
  const [activeNav, setActiveNav] = useState("colors");

  const groups: Record<string, typeof navSections> = {};
  for (const s of navSections) {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* ─── Left Sidebar ─────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-56 flex-col bg-slate-950 text-slate-300">
        {/* Logo */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-5 py-4">
          <div className="flex size-7 items-center justify-center rounded-lg bg-white">
            <Zap className="size-4 text-slate-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">K-SMART</p>
            <p className="font-mono text-[10px] text-slate-500">Design System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-4">
              <p className="px-5 pb-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                {group}
              </p>
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveNav(item.id)}
                  className={`flex items-center gap-2 px-5 py-1.5 text-sm transition-colors hover:text-white ${
                    activeNav === item.id
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-5 py-3">
          <p className="font-mono text-[10px] text-slate-600">v1.0 · Tailwind CSS 4</p>
        </div>
      </aside>

      {/* ─── Main Content ──────────────────────────────── */}
      <main className="ml-56 flex-1">
        {/* Page header */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">Design System</h1>
              <p className="text-xs text-slate-500">Token-level reference · K-SMART Platform</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                React 19
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                Tailwind v4
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                Radix UI
              </Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ════════════════════════════════════════════ */}
          {/* 01 · COLORS                                 */}
          {/* ════════════════════════════════════════════ */}
          <SectionHeader
            num="01"
            id="colors"
            title="Color Tokens"
            desc="Semantic CSS custom properties — use token names, never raw values in components."
          />

          {/* Semantic palette */}
          <div className="mb-8 space-y-6">
            {colorTokens.map((group) => (
              <div key={group.group}>
                <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.group}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {group.tokens.map((t) => (
                    <div
                      key={t.name}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div
                        className="h-14 w-full border-b border-slate-100"
                        style={{ backgroundColor: t.swatch }}
                      />
                      <div className="p-3">
                        <p className="font-mono text-xs font-semibold text-slate-800">{t.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{t.desc}</p>
                        <div className="mt-2 space-y-1">
                          <TokenPill value={t.light} />
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-slate-400">{t.tailwind}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Status colors */}
          <ShowcaseBox title="status-colors — applied via Tailwind utilities" className="mb-8">
            <div className="flex flex-wrap gap-2">
              {statusColors.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                >
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: s.text }} />
                  {s.label}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3">
              {statusColors.map((s) => (
                <code
                  key={s.name}
                  className="rounded bg-slate-50 px-2 py-1 font-mono text-[10px] text-slate-600"
                >
                  bg-{s.name.toLowerCase()}-50 / text-{s.name.toLowerCase()}-600
                </code>
              ))}
            </div>
          </ShowcaseBox>

          {/* Chart colors */}
          <ShowcaseBox title="chart-colors — --chart-1 through --chart-5">
            <div className="flex gap-3">
              {chartColors.map((c) => (
                <div key={c.token} className="flex flex-col items-center gap-1.5">
                  <div
                    className="size-10 rounded-lg border border-slate-200 shadow-sm"
                    style={{ backgroundColor: c.swatch }}
                  />
                  <p className="font-mono text-[10px] text-slate-500">{c.token}</p>
                  <p className="text-[10px] text-slate-400">{c.name}</p>
                </div>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 02 · TYPOGRAPHY                             */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="02"
              id="typography"
              title="Typography"
              desc="Inter (--font-sans) loaded via next/font/google. Tailwind default type scale."
            />
          </div>

          <ShowcaseBox title="type-scale" className="mb-6">
            <div className="space-y-4">
              {typeScale.map((t) => (
                <div key={t.class} className="flex items-baseline gap-4">
                  <div className="w-20 shrink-0">
                    <TokenPill value={t.class} />
                  </div>
                  <div className="w-16 shrink-0 text-right font-mono text-xs text-slate-400">
                    {t.size}
                  </div>
                  <p
                    className={`${t.class} text-slate-900 leading-none`}
                    style={{ fontWeight: t.weight }}
                  >
                    The quick brown fox
                  </p>
                  <p className="ml-auto hidden text-xs text-slate-400 sm:block">{t.usage}</p>
                </div>
              ))}
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="font-weights">
            <div className="flex flex-wrap gap-8">
              {[
                ["font-normal", "400", "Regular"],
                ["font-medium", "500", "Medium"],
                ["font-semibold", "600", "SemiBold"],
                ["font-bold", "700", "Bold"],
                ["font-extrabold", "800", "ExtraBold"],
              ].map(([cls, w, name]) => (
                <div key={cls}>
                  <p className={`text-2xl text-slate-900 ${cls}`}>Ag</p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{cls}</p>
                  <p className="font-mono text-[10px] text-slate-400">
                    {w} · {name}
                  </p>
                </div>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 03 · SPACING                                */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="03"
              id="spacing"
              title="Spacing"
              desc="4px base grid. Standard Tailwind scale — no custom spacing values."
            />
          </div>

          <ShowcaseBox title="spacing-scale">
            <div className="space-y-2">
              {spacingTokens.map((s) => (
                <div key={s.class} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <TokenPill value={s.class} />
                  </div>
                  <div className="w-12 shrink-0 font-mono text-xs text-slate-400">{s.value}</div>
                  <div className="h-4 rounded-sm bg-primary" style={{ width: s.value }} />
                  <span className="text-xs text-slate-400">{s.desc}</span>
                </div>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 04 · BORDER RADIUS                          */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="04"
              id="radius"
              title="Border Radius"
              desc="Base: --radius: 0.5rem (8px). Scale via calc() from the base token."
            />
          </div>

          <ShowcaseBox title="radius-scale">
            <div className="flex flex-wrap items-end gap-4">
              {radiusTokens.map((r) => (
                <div key={r.tailwind} className="flex flex-col items-center gap-2">
                  <div className={`size-14 border-2 border-primary bg-primary/10 ${r.tailwind}`} />
                  <TokenPill value={r.tailwind} />
                  <p className="font-mono text-[10px] text-slate-400">{r.computed}</p>
                  <p className="max-w-[80px] text-center text-[10px] text-slate-400">{r.usage}</p>
                </div>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 05 · EFFECTS                                */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="05"
              id="effects"
              title="Shadows & Effects"
              desc="Elevation via shadows. Glass utilities for nav and card surfaces."
            />
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[
              { name: "shadow-sm", label: "sm — Cards, inputs" },
              { name: "shadow-md", label: "md — Popovers" },
              { name: "shadow-lg", label: "lg — Modals, toasts" },
            ].map((s) => (
              <div
                key={s.name}
                className={`flex h-20 items-center justify-center rounded-xl border border-slate-200 bg-white ${s.name}`}
              >
                <div className="text-center">
                  <TokenPill value={s.name} />
                  <p className="mt-1 text-xs text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass flex h-20 items-center justify-center rounded-xl">
              <div className="text-center">
                <TokenPill value=".glass" />
                <p className="mt-1 text-xs text-slate-500">Frosted glass surface</p>
              </div>
            </div>
            <div className="glass-card flex h-20 items-center justify-center rounded-xl">
              <div className="text-center">
                <TokenPill value=".glass-card" />
                <p className="mt-1 text-xs text-slate-500">Card with transition</p>
              </div>
            </div>
            <div className="glass-header flex h-20 items-center justify-center rounded-xl">
              <div className="text-center">
                <TokenPill value=".glass-header" />
                <p className="mt-1 text-xs text-slate-500">Sticky nav surface</p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* 06 · BUTTONS                                */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="06"
              id="buttons"
              title="Buttons"
              desc="6 variants × 8 sizes. Built on CVA + Radix Slot for asChild composition."
            />
          </div>

          <ShowcaseBox title="variant" className="mb-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="size" className="mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="xs">Size xs</Button>
              <Button size="sm">Size sm</Button>
              <Button size="default">Size default</Button>
              <Button size="lg">Size lg</Button>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="icon variants" className="mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="icon-xs" variant="ghost">
                <Star />
              </Button>
              <Button size="icon-sm" variant="outline">
                <Bell />
              </Button>
              <Button size="icon">
                <Settings />
              </Button>
              <Button size="icon-lg" variant="secondary">
                <Package />
              </Button>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="with-icon" className="mb-4">
            <div className="flex flex-wrap gap-3">
              <Button>
                <ShoppingCart />
                Add to Cart
              </Button>
              <Button variant="outline">
                <Copy />
                Copy Link
              </Button>
              <Button variant="destructive">
                <Trash2 />
                Delete
              </Button>
              <Button variant="secondary" disabled>
                <Check />
                Saved
              </Button>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="states">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button disabled>Disabled</Button>
              <Button className="opacity-60 cursor-wait">Loading…</Button>
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 07 · BADGES                                 */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="07"
              id="badges"
              title="Badges"
              desc="4 variants. rounded-full shape, text-xs weight. Used for status, labels, counts."
            />
          </div>

          <ShowcaseBox title="variant" className="mb-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="with-icon" className="mb-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">
                <Check className="size-3" />
                Completed
              </Badge>
              <Badge variant="outline">
                <Info className="size-3" />
                Processing
              </Badge>
              <Badge variant="destructive">
                <AlertCircle className="size-3" />
                Cancelled
              </Badge>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="status-badges — applied with direct Tailwind utilities">
            <div className="flex flex-wrap gap-2">
              {statusColors.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
                >
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: s.text }} />
                  {s.label}
                </span>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 08 · CARDS                                  */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="08"
              id="cards"
              title="Cards"
              desc="Slot-based composition: Card > CardHeader > (CardTitle + CardDescription + CardAction?) + CardContent + CardFooter."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ShowcaseBox title="basic-card">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Product Analytics</CardTitle>
                  <CardDescription>Last 30 days performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Revenue increased by 12% compared to previous period.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">
                    View Report
                  </Button>
                </CardFooter>
              </Card>
            </ShowcaseBox>

            <ShowcaseBox title="card-with-action">
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Total Orders</CardTitle>
                  <CardDescription>Today</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">1,248</p>
                  <p className="mt-1 text-sm text-emerald-600">↑ 8.2% from yesterday</p>
                </CardContent>
              </Card>
            </ShowcaseBox>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* 09 · FORMS                                  */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="09"
              id="forms"
              title="Forms"
              desc="Input, Select, Textarea, Switch, RadioGroup, Label. All support focus-visible rings and aria-invalid error states."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ShowcaseBox title="input + label">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input id="email" type="email" placeholder="kien@ksmart.vn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="search">Search products</Label>
                  <Input id="search" placeholder="Type to search…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disabled-input">Disabled</Label>
                  <Input id="disabled-input" disabled placeholder="Cannot edit" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invalid-input">Error state</Label>
                  <Input
                    id="invalid-input"
                    aria-invalid="true"
                    defaultValue="invalid@"
                    className="border-red-300"
                  />
                  <p className="text-xs text-destructive">Please enter a valid email.</p>
                </div>
              </div>
            </ShowcaseBox>

            <ShowcaseBox title="select">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skincare">Skincare</SelectItem>
                      <SelectItem value="makeup">Makeup</SelectItem>
                      <SelectItem value="fragrance">Fragrance</SelectItem>
                      <SelectItem value="haircare">Hair Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Size sm</Label>
                  <Select>
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue placeholder="Select size…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="25">25 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ShowcaseBox>

            <ShowcaseBox title="textarea">
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Write your message here…"
                  className="min-h-[100px]"
                />
              </div>
            </ShowcaseBox>

            <ShowcaseBox title="switch + radio-group">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Toggles</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <Switch id="s1" checked={switchA} onCheckedChange={setSwitchA} />
                      <Label htmlFor="s1" className="cursor-pointer">
                        Email notifications {switchA ? "(On)" : "(Off)"}
                      </Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch id="s2" checked={switchB} onCheckedChange={setSwitchB} />
                      <Label htmlFor="s2" className="cursor-pointer">
                        SMS alerts {switchB ? "(On)" : "(Off)"}
                      </Label>
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Shipping method</Label>
                  <RadioGroup value={radio} onValueChange={setRadio}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="option-a" id="ra" />
                      <Label htmlFor="ra" className="cursor-pointer">
                        Standard (Free)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="option-b" id="rb" />
                      <Label htmlFor="rb" className="cursor-pointer">
                        Express (25,000₫)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="option-c" id="rc" />
                      <Label htmlFor="rc" className="cursor-pointer">
                        Same-day (50,000₫)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </ShowcaseBox>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* 10 · NAVIGATION                             */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="10"
              id="navigation"
              title="Navigation"
              desc="Breadcrumb, Tabs, Separator. For pagination see pagination-controls component."
            />
          </div>

          <ShowcaseBox title="breadcrumb" className="mb-4">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="flex items-center gap-1">
                    <Home className="size-3.5" />
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Products</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Skincare</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ShowcaseBox>

          <ShowcaseBox title="tabs" className="mb-4">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Overview tab content — product summary, quick stats, recent activity.
                </p>
              </TabsContent>
              <TabsContent value="analytics" className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Analytics tab content — charts, trends, conversion metrics.
                </p>
              </TabsContent>
              <TabsContent value="settings" className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Settings tab content — configuration, preferences, integrations.
                </p>
              </TabsContent>
            </Tabs>
          </ShowcaseBox>

          <ShowcaseBox title="separator">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-700">Horizontal (default)</p>
                <Separator className="my-3" />
                <p className="text-sm text-slate-400">Content below separator</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">Item A</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm">Item B</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm">Item C</span>
              </div>
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 11 · DATA DISPLAY                           */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="11"
              id="data-display"
              title="Data Display"
              desc="Avatar, Skeleton, Table, ScrollArea — for presenting structured information."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ShowcaseBox title="avatar">
              <div className="flex flex-wrap items-center gap-4">
                {/* With image */}
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar className="size-12">
                    <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=KH" alt="KH" />
                    <AvatarFallback>KH</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-slate-400">size-12</p>
                </div>
                {/* Fallback */}
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar className="size-10">
                    <AvatarFallback>AB</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-slate-400">fallback</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar className="size-8">
                    <AvatarFallback>CD</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-slate-400">size-8</p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-[10px]">EF</AvatarFallback>
                  </Avatar>
                  <p className="text-xs text-slate-400">size-6</p>
                </div>
                {/* Avatar stack — use plain divs to avoid inline-style/Radix shape conflicts */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {(["#6366f1", "#ec4899", "#f59e0b"] as const).map((color, i) => (
                      <div
                        key={i}
                        className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-xs font-medium text-slate-600">
                      +5
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">stack</p>
                </div>
              </div>
            </ShowcaseBox>

            <ShowcaseBox title="skeleton">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-32 w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              </div>
            </ShowcaseBox>
          </div>

          <ShowcaseBox title="table" className="mt-4 mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: "#ORD-001",
                    customer: "Nguyễn Thị A",
                    status: "Delivered",
                    statusColor: "emerald",
                    total: "485,000₫",
                    date: "20/03/2026",
                  },
                  {
                    id: "#ORD-002",
                    customer: "Trần Văn B",
                    status: "Processing",
                    statusColor: "blue",
                    total: "250,000₫",
                    date: "20/03/2026",
                  },
                  {
                    id: "#ORD-003",
                    customer: "Lê Thị C",
                    status: "Pending",
                    statusColor: "amber",
                    total: "1,200,000₫",
                    date: "19/03/2026",
                  },
                  {
                    id: "#ORD-004",
                    customer: "Phạm Minh D",
                    status: "Cancelled",
                    statusColor: "red",
                    total: "320,000₫",
                    date: "19/03/2026",
                  },
                ].map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-mono text-sm font-medium">{row.id}</TableCell>
                    <TableCell className="text-sm">{row.customer}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-${row.statusColor}-50 text-${row.statusColor}-600 border-${row.statusColor}-100`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{row.total}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-400">
                      {row.date}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ShowcaseBox>

          <ShowcaseBox title="scroll-area">
            {/* overflow-hidden on the wrapper ensures the Radix Root clips correctly */}
            <div className="overflow-hidden rounded-lg border" style={{ height: "144px" }}>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className="size-6 rounded bg-slate-100 text-center text-xs leading-6 text-slate-500">
                        {i + 1}
                      </div>
                      <p className="text-sm text-slate-700">Scrollable list item {i + 1}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 12 · OVERLAYS                               */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="12"
              id="overlays"
              title="Overlays"
              desc="Dialog, AlertDialog, Tooltip, Popover, DropdownMenu. All use Radix UI primitives with enter/exit animations."
            />
          </div>

          <ShowcaseBox title="dialog" className="mb-4">
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Product</DialogTitle>
                    <DialogDescription>
                      Make changes to the product details. Click save when done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="pname">Product name</Label>
                      <Input id="pname" defaultValue="Klairs Gentle Black Fresh Cleanser" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pprice">Price (₫)</Label>
                      <Input id="pprice" defaultValue="285,000" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Product</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. The product will be permanently deleted from
                      your inventory.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </ShowcaseBox>

          <ShowcaseBox title="tooltip + popover + dropdown-menu">
            <div className="flex flex-wrap gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Info />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>This is a helpful tooltip</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Filter Options</h4>
                    <p className="text-xs text-muted-foreground">
                      Configure your view preferences from this popover panel.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        Apply
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Reset
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Actions
                    <ChevronRight className="ml-1 size-3.5 rotate-90" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Github className="size-4" />
                    Repository
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive">
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 13 · COMMAND                                */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="13"
              id="command"
              title="Command"
              desc="cmdk-powered command palette. Inline or inside CommandDialog (modal). Supports groups, keyboard shortcuts, and empty states."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ShowcaseBox title="inline-command">
              <Command className="rounded-xl border border-slate-200 shadow-sm">
                <CommandInput placeholder="Search commands…" />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Products">
                    <CommandItem>
                      <Package className="size-4" />
                      New Product
                    </CommandItem>
                    <CommandItem>
                      <ShoppingCart className="size-4" />
                      View Orders
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Account">
                    <CommandItem>
                      <User className="size-4" />
                      Profile Settings
                    </CommandItem>
                    <CommandItem>
                      <Bell className="size-4" />
                      Notifications
                    </CommandItem>
                    <CommandItem className="text-destructive data-[selected=true]:text-destructive">
                      <LogOut className="size-4" />
                      Sign Out
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </ShowcaseBox>

            <ShowcaseBox title="command-description">
              <div className="space-y-3">
                <p className="text-sm text-slate-700">
                  The <TokenPill value="Command" /> component wraps <TokenPill value="cmdk" /> to
                  provide a fully accessible command palette with fuzzy search, keyboard navigation,
                  and group organization.
                </p>
                <div className="space-y-1.5">
                  {[
                    ["CommandInput", "Search bar with icon"],
                    ["CommandList", "Scrollable results container"],
                    ["CommandGroup", "Labelled group of items"],
                    ["CommandItem", "Single selectable command"],
                    ["CommandSeparator", "Visual divider between groups"],
                    ["CommandEmpty", "Fallback when no results"],
                    ["CommandShortcut", "Keyboard shortcut label"],
                  ].map(([name, desc]) => (
                    <div key={name} className="flex items-center gap-2">
                      <TokenPill value={name} />
                      <span className="text-xs text-slate-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ShowcaseBox>
          </div>

          {/* ════════════════════════════════════════════ */}
          {/* 14 · SHEET                                  */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="14"
              id="sheet"
              title="Sheet"
              desc="Side-anchored drawer built on Radix Dialog. Supports left, right, top, and bottom sides."
            />
          </div>

          <ShowcaseBox title="sheet — all sides">
            <div className="flex flex-wrap gap-3">
              {(["left", "right", "top", "bottom"] as const).map((side) => (
                <Sheet key={side}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="capitalize">
                      {side}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side={side}>
                    <SheetHeader>
                      <SheetTitle>Sheet — {side}</SheetTitle>
                      <SheetDescription>
                        This sheet slides in from the {side}. Use for navigation, filters, or detail
                        panels.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`sheet-input-${side}`}>Filter by name</Label>
                          <Input id={`sheet-input-${side}`} placeholder="Search…" />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <div className="flex flex-col gap-1.5">
                            {["Skincare", "Makeup", "Fragrance"].map((cat) => (
                              <div key={cat} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`${side}-${cat}`}
                                  className="size-4 rounded"
                                />
                                <label htmlFor={`${side}-${cat}`} className="text-sm">
                                  {cat}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <SheetFooter>
                      <Button variant="outline" className="flex-1">
                        Reset
                      </Button>
                      <Button className="flex-1">Apply Filters</Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              ))}
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 15 · NUMBER INPUT                           */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="15"
              id="number-input"
              title="Number Input"
              desc="react-number-format wrapper. Vietnamese locale: thousand separator (.) and decimal separator (,). Rounds cleanly for currency."
            />
          </div>

          <ShowcaseBox title="number-input">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Product price (₫)</Label>
                <NumberInput placeholder="0" suffix=" ₫" defaultValue={285000} />
                <p className="text-xs text-slate-400">
                  Formats: 285.000 ₫ · Separator: (.) thousands, (,) decimal
                </p>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <NumberInput placeholder="0" defaultValue={12} />
              </div>
              <div className="space-y-2">
                <Label>Discount (%)</Label>
                <NumberInput
                  placeholder="0"
                  suffix="%"
                  decimalScale={1}
                  max={100}
                  defaultValue={15.5}
                />
              </div>
              <div className="space-y-2">
                <Label>Disabled</Label>
                <NumberInput placeholder="0" defaultValue={99000} disabled />
              </div>
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* 16 · PAGINATION                             */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <SectionHeader
              num="16"
              id="pagination"
              title="Pagination Controls"
              desc="Smart page number ellipsis. Shows first/last jump buttons. Accepts currentPage, totalPages, onPageChange."
            />
          </div>

          <ShowcaseBox title="pagination-controls — interactive">
            <PaginationControls currentPage={page} totalPages={12} onPageChange={setPage} />
            <div className="mt-2 flex justify-center">
              <TokenPill value={`currentPage: ${page} / totalPages: 12`} />
            </div>
          </ShowcaseBox>

          {/* ════════════════════════════════════════════ */}
          {/* Token Quick Reference                       */}
          {/* ════════════════════════════════════════════ */}
          <div className="mt-16">
            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-8 text-white">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Token Quick Reference</h2>
                  <p className="text-sm text-slate-400">
                    Copy-paste ready — all semantic tokens in one place
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Color — background", "bg-background / text-foreground"],
                  ["Color — primary", "bg-primary / text-primary-foreground"],
                  ["Color — muted", "bg-muted / text-muted-foreground"],
                  ["Color — destructive", "bg-destructive / text-white"],
                  ["Color — border", "border-border / border-input"],
                  ["Color — ring", "ring-ring / outline-ring"],
                  ["Radius — button/input", "rounded-md (6px)"],
                  ["Radius — card/popover", "rounded-xl (12px)"],
                  ["Shadow — card", "shadow-sm"],
                  ["Shadow — overlay", "shadow-lg"],
                  ["Effect — nav header", ".glass-header"],
                  ["Effect — surface", ".glass / .glass-card"],
                ].map(([label, token]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2"
                  >
                    <span className="text-xs text-slate-400">{label}</span>
                    <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-slate-200">
                      {token}
                    </code>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 rounded-lg border border-slate-700 bg-white/5 px-4 py-3">
                <Moon className="size-4 text-slate-400" />
                <p className="text-sm text-slate-300">
                  Dark mode: add{" "}
                  <code className="rounded bg-white/10 px-1.5 font-mono text-xs">.dark</code> class
                  to{" "}
                  <code className="rounded bg-white/10 px-1.5 font-mono text-xs">&lt;html&gt;</code>
                  . Light = HSL · Dark = OKLch for perceptual uniformity.
                </p>
                <Sun className="ml-auto size-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 border-t border-slate-200 pt-8 pb-16">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">K-SMART Design System</p>
                <p className="text-xs text-slate-400">
                  Tailwind CSS v4 · Radix UI · React 19 · CVA
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  packages/ui
                </Badge>
                <Badge variant="outline" className="font-mono text-xs">
                  DESIGN.md
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
