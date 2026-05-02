export interface SpacingToken {
  class: string;
  value: string;
  desc: string;
}

export const spacingTokens: SpacingToken[] = [
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

export const shadowTokens: ReadonlyArray<{ name: string; label: string }> = [
  { name: "shadow-sm", label: "sm — Cards, inputs" },
  { name: "shadow-md", label: "md — Popovers" },
  { name: "shadow-lg", label: "lg — Modals, toasts" },
];
