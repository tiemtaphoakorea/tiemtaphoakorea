export interface ChartColor {
  token: string;
  value: string;
  swatch: string;
  name: string;
}

export const chartColors: ChartColor[] = [
  { token: "--chart-1", value: "hsl(222 47% 11%)", swatch: "#0f172a", name: "Slate 900" },
  { token: "--chart-2", value: "hsl(215 16% 47%)", swatch: "#64748b", name: "Slate 600" },
  { token: "--chart-3", value: "hsl(215 25% 27%)", swatch: "#334155", name: "Slate 800" },
  { token: "--chart-4", value: "hsl(214 32% 91%)", swatch: "#e2e8f0", name: "Slate 200" },
  { token: "--chart-5", value: "hsl(210 40% 96%)", swatch: "#f1f5f9", name: "Slate 100" },
];
