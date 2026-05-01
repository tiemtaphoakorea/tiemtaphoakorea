export interface StatusColor {
  label: string;
  /** CSS variable token name (without `--` prefix) */
  token: "success" | "warning" | "info" | "destructive";
  /** Tailwind classes for the soft pill style — uses semantic tokens, no raw hex */
  classes: string;
}

export const statusColors: StatusColor[] = [
  {
    label: "Success",
    token: "success",
    classes: "bg-success-soft text-success border-success/20",
  },
  {
    label: "Warning",
    token: "warning",
    classes: "bg-warning-soft text-warning border-warning/20",
  },
  {
    label: "Info",
    token: "info",
    classes: "bg-info-soft text-info border-info/20",
  },
  {
    label: "Error",
    token: "destructive",
    classes: "bg-destructive-soft text-destructive border-destructive/20",
  },
];
