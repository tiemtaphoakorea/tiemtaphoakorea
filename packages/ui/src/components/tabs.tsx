import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

// Two variants per design-system/admin/Admin CMS.html:
// • default — `.filter-tabs/.ftab` segmented pill control (filter switchers).
// • line    — `.report-tabs/.rtab` underline tabs (content-level nav).

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn("group/tabs flex gap-2 data-horizontal:flex-col", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex items-center text-muted-foreground group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        // .filter-tabs: gap:1px · bg:gray-200 (#E5E7EB) · radius:8px · padding:2px · h:32px
        default:
          "h-8 w-fit gap-px overflow-hidden rounded-lg bg-gray-200 p-0.5 group-data-vertical/tabs:h-fit",
        // .report-tabs: border-bottom · bg-white · padding:0 18px
        line: "w-full gap-0 border-b border-border bg-background px-[18px] group-data-vertical/tabs:border-r group-data-vertical/tabs:border-b-0 group-data-vertical/tabs:px-0 group-data-vertical/tabs:py-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // ── Shared base ──
        "relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",

        // ── Default (.ftab) ──
        // padding:4px 13px · radius:6px · 12px/1 medium · color:smoke
        "rounded-md px-3.5 py-2 text-xs leading-none font-medium text-muted-foreground hover:text-foreground",
        // .ftab.active — bg:white · color:ink · font-weight:600 · shadow-sm
        "data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:shadow-sm",

        // ── Line override (.rtab) — only when parent list has variant=line ──
        // padding:12px 16px · 13px/1 medium · border-b 2px transparent · margin-b:-1px
        "group-data-[variant=line]/tabs-list:-mb-px group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-b-2 group-data-[variant=line]/tabs-list:border-transparent group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-4 group-data-[variant=line]/tabs-list:py-3 group-data-[variant=line]/tabs-list:text-[13px] group-data-[variant=line]/tabs-list:shadow-none",
        // .rtab.active — color:primary · border-bottom:primary · font-weight:600
        "group-data-[variant=line]/tabs-list:data-active:border-primary group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:data-active:shadow-none",

        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
