export interface ColorToken {
  name: string;
  value: string;
  tailwind: string;
  desc: string;
  swatch: string;
}

export interface ColorTokenGroup {
  group: string;
  tokens: ColorToken[];
}

export const colorTokens: ColorTokenGroup[] = [
  {
    group: "Surface",
    tokens: [
      {
        name: "--background",
        value: "hsl(0 0% 100%)",
        tailwind: "bg-background",
        desc: "Page background",
        swatch: "#ffffff",
      },
      {
        name: "--card",
        value: "hsl(0 0% 100%)",
        tailwind: "bg-card",
        desc: "Card surface",
        swatch: "#ffffff",
      },
      {
        name: "--popover",
        value: "hsl(0 0% 100%)",
        tailwind: "bg-popover",
        desc: "Popover, dropdown surface",
        swatch: "#ffffff",
      },
    ],
  },
  {
    group: "Text",
    tokens: [
      {
        name: "--foreground",
        value: "hsl(222 47% 11%)",
        tailwind: "text-foreground",
        desc: "Body text",
        swatch: "#0f172a",
      },
      {
        name: "--card-foreground",
        value: "hsl(222 47% 11%)",
        tailwind: "text-card-foreground",
        desc: "Text on card",
        swatch: "#0f172a",
      },
      {
        name: "--muted-foreground",
        value: "hsl(215 16% 47%)",
        tailwind: "text-muted-foreground",
        desc: "Supporting text",
        swatch: "#64748b",
      },
    ],
  },
  {
    group: "Brand",
    tokens: [
      {
        name: "--primary",
        value: "hsl(222 47% 11%)",
        tailwind: "bg-primary",
        desc: "Primary CTA / brand surface",
        swatch: "#0f172a",
      },
      {
        name: "--primary-foreground",
        value: "hsl(210 40% 98%)",
        tailwind: "text-primary-foreground",
        desc: "Text on primary",
        swatch: "#f8fafc",
      },
      {
        name: "--accent",
        value: "hsl(210 40% 96.1%)",
        tailwind: "bg-accent",
        desc: "Hover, focus surface",
        swatch: "#f1f5f9",
      },
    ],
  },
  {
    group: "Neutral",
    tokens: [
      {
        name: "--secondary",
        value: "hsl(0 0% 100%)",
        tailwind: "bg-secondary",
        desc: "Secondary button surface",
        swatch: "#ffffff",
      },
      {
        name: "--muted",
        value: "hsl(210 40% 96.1%)",
        tailwind: "bg-muted",
        desc: "Muted background, tabs list",
        swatch: "#f1f5f9",
      },
      {
        name: "--border",
        value: "hsl(214.3 31.8% 91.4%)",
        tailwind: "border-border",
        desc: "Hairline divider",
        swatch: "#e2e8f0",
      },
      {
        name: "--input",
        value: "hsl(214.3 31.8% 91.4%)",
        tailwind: "border-input",
        desc: "Input border",
        swatch: "#e2e8f0",
      },
      {
        name: "--ring",
        value: "hsl(222 47% 11%)",
        tailwind: "ring-ring",
        desc: "Focus ring",
        swatch: "#0f172a",
      },
    ],
  },
  {
    group: "Status",
    tokens: [
      {
        name: "--success",
        value: "hsl(160 84% 39%)",
        tailwind: "bg-success",
        desc: "Success state",
        swatch: "#059669",
      },
      {
        name: "--warning",
        value: "hsl(32 95% 44%)",
        tailwind: "bg-warning",
        desc: "Warning state",
        swatch: "#d97706",
      },
      {
        name: "--info",
        value: "hsl(221 83% 53%)",
        tailwind: "bg-info",
        desc: "Info state",
        swatch: "#2563eb",
      },
      {
        name: "--destructive",
        value: "hsl(0 84% 60%)",
        tailwind: "bg-destructive",
        desc: "Errors, delete",
        swatch: "#ef4444",
      },
    ],
  },
  {
    group: "Sidebar",
    tokens: [
      {
        name: "--sidebar",
        value: "hsl(0 0% 98%)",
        tailwind: "bg-sidebar",
        desc: "Sidebar surface",
        swatch: "#fafafa",
      },
      {
        name: "--sidebar-foreground",
        value: "hsl(240 5.3% 26.1%)",
        tailwind: "text-sidebar-foreground",
        desc: "Sidebar text",
        swatch: "#3f3f46",
      },
      {
        name: "--sidebar-accent",
        value: "hsl(240 4.8% 95.9%)",
        tailwind: "bg-sidebar-accent",
        desc: "Sidebar hover",
        swatch: "#f4f4f5",
      },
      {
        name: "--sidebar-border",
        value: "hsl(220 13% 91%)",
        tailwind: "border-sidebar-border",
        desc: "Sidebar divider",
        swatch: "#e4e4e7",
      },
    ],
  },
];
