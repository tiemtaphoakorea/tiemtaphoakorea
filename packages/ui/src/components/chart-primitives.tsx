"use client";

import type * as React from "react";
import * as RechartsPrimitive from "recharts";

export function ChartResponsiveContainer({ children }: { children: React.ReactNode }) {
  return (
    <RechartsPrimitive.ResponsiveContainer>
      {children as React.ReactElement}
    </RechartsPrimitive.ResponsiveContainer>
  );
}

export function ChartTooltipPrimitive(props: Record<string, unknown>) {
  return <RechartsPrimitive.Tooltip {...props} />;
}

export function ChartLegendPrimitive(props: Record<string, unknown>) {
  return <RechartsPrimitive.Legend {...props} />;
}
