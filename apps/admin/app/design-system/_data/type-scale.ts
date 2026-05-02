export interface TypeScaleEntry {
  class: string;
  size: string;
  lh: string;
  weight: string;
  usage: string;
}

export const typeScale: TypeScaleEntry[] = [
  { class: "text-xs", size: "12px", lh: "16px", weight: "400", usage: "Captions, badge text" },
  { class: "text-sm", size: "14px", lh: "20px", weight: "400", usage: "Body small, table data" },
  { class: "text-base", size: "16px", lh: "24px", weight: "400", usage: "Body copy, inputs" },
  { class: "text-lg", size: "18px", lh: "28px", weight: "600", usage: "Subheadings" },
  { class: "text-xl", size: "20px", lh: "28px", weight: "600", usage: "Card titles" },
  { class: "text-2xl", size: "24px", lh: "32px", weight: "700", usage: "Section headings" },
  { class: "text-3xl", size: "30px", lh: "36px", weight: "700", usage: "Page titles" },
  { class: "text-4xl", size: "36px", lh: "40px", weight: "800", usage: "Hero headings" },
];

export const fontWeights: ReadonlyArray<readonly [string, string, string]> = [
  ["font-normal", "400", "Regular"],
  ["font-medium", "500", "Medium"],
  ["font-semibold", "600", "SemiBold"],
  ["font-bold", "700", "Bold"],
  ["font-extrabold", "800", "ExtraBold"],
];
