import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

// Variants & sizes follow design-system/preview/buttons.html (storefront tokens
// applied project-wide). Indigo brand · 36/44/48 size scale · shadow-pop CTAs.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Primary CTA — indigo brand with shadow-pop
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_rgba(79,70,229,0.18)] hover:bg-[#4F46E5] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:opacity-100 disabled:shadow-none",
        // Deal / flash-sale orange CTA
        accent:
          "bg-accent text-accent-foreground shadow-[0_4px_0_rgba(217,119,6,0.22)] hover:bg-[#D97706] disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:opacity-100 disabled:shadow-none",
        // Soft secondary — indigo tint
        secondary: "bg-[#EEF2FF] text-primary hover:border-primary aria-expanded:border-primary",
        // Outline — indigo border on white
        outline:
          "border-[1.5px] border-primary bg-card text-primary hover:bg-[#EEF2FF] aria-expanded:bg-[#EEF2FF]",
        // Neutral ghost — soft border on white
        ghost:
          "border-[1.5px] border-border bg-card text-foreground hover:border-muted-foreground aria-expanded:border-muted-foreground",
        // Destructive (kept compatible with existing usages)
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        // Link — text-only primary
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // 44px — Vừa (default storefront CTA)
        default:
          "h-11 gap-2 px-[18px] has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        // 28px — compact (admin tables, dense filters)
        xs: "h-7 gap-1 rounded-[8px] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        // 36px — Nhỏ
        sm: "h-9 gap-1.5 rounded-[10px] px-3.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        // 48px — Lớn (hero CTA)
        lg: "h-12 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs":
          "size-7 rounded-[8px] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-[10px] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-12",
      },
      shape: {
        square: "",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "square",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  shape = "square",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      type={asChild ? undefined : "button"}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-shape={shape}
      className={cn(buttonVariants({ variant, size, shape, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
