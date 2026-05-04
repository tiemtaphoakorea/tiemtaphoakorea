"use client";

import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Progress as ProgressPrimitive } from "radix-ui";
import type * as React from "react";

// Track height matches CMS `.prog-bar` (~7px). bg-muted gives the soft track.
const progressVariants = cva(
  "relative flex w-full items-center overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-1.5",
        lg: "h-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

// Tone variants for the indicator — drives goal/KPI/category color coding.
const indicatorVariants = cva("size-full flex-1 transition-all", {
  variants: {
    tone: {
      primary: "bg-primary",
      success: "bg-success",
      warning: "bg-warning",
      destructive: "bg-destructive",
      muted: "bg-muted-foreground/40",
    },
  },
  defaultVariants: {
    tone: "primary",
  },
});

function Progress({
  className,
  indicatorClassName,
  indicatorStyle,
  value,
  size,
  tone,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> &
  VariantProps<typeof indicatorVariants> & {
    indicatorClassName?: string;
    indicatorStyle?: React.CSSProperties;
  }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ size }), className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(indicatorVariants({ tone }), indicatorClassName)}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...indicatorStyle,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { indicatorVariants, Progress, progressVariants };
