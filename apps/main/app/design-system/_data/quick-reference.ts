export const tokenQuickReference: ReadonlyArray<readonly [string, string]> = [
  ["Surface — page", "bg-background / text-foreground"],
  ["Surface — card", "bg-card / text-card-foreground"],
  ["Brand — primary CTA", "bg-primary / text-primary-foreground"],
  ["Brand — accent / hover", "bg-accent / text-accent-foreground"],
  ["Neutral — muted bg", "bg-muted / text-muted-foreground"],
  ["Status — success", "bg-success-soft text-success border-success/20"],
  ["Status — warning", "bg-warning-soft text-warning border-warning/20"],
  ["Status — info", "bg-info-soft text-info border-info/20"],
  ["Status — destructive", "bg-destructive-soft text-destructive border-destructive/20"],
  ["Border / Input", "border-border / border-input"],
  ["Focus ring", "ring-ring / outline-ring"],
  ["Radius — button / input", "rounded-lg (8px)"],
  ["Radius — card / popover", "rounded-xl (12px)"],
  ["Radius — badge", "rounded-full / rounded-3xl"],
  ["Shadow — card", "shadow-sm"],
  ["Shadow — overlay", "shadow-lg"],
];

export const commandTokens: ReadonlyArray<readonly [string, string]> = [
  ["CommandInput", "Search bar with icon"],
  ["CommandList", "Scrollable results container"],
  ["CommandGroup", "Labelled group of items"],
  ["CommandItem", "Single selectable command"],
  ["CommandSeparator", "Visual divider between groups"],
  ["CommandEmpty", "Fallback when no results"],
  ["CommandShortcut", "Keyboard shortcut label"],
];

export const avatarStackColors = ["#6366f1", "#ec4899", "#f59e0b"] as const;
export const sheetSides = ["left", "right", "top", "bottom"] as const;
export const sheetCategories = ["Skincare", "Makeup", "Fragrance"] as const;
