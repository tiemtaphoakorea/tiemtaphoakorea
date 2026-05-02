export interface NavSection {
  id: string;
  label: string;
  group: string;
}

export const navSections: NavSection[] = [
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
  { id: "table", label: "Table & DataTable", group: "Components" },
  { id: "overlays", label: "Overlays", group: "Components" },
  { id: "command", label: "Command", group: "Components" },
  { id: "sheet", label: "Sheet", group: "Components" },
  { id: "number-input", label: "Number Input", group: "Components" },
  { id: "pagination", label: "Pagination", group: "Components" },
];

export const navGroups: Record<string, NavSection[]> = navSections.reduce(
  (acc, section) => {
    if (!acc[section.group]) acc[section.group] = [];
    acc[section.group].push(section);
    return acc;
  },
  {} as Record<string, NavSection[]>,
);
