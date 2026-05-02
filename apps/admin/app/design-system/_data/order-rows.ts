export interface OrderRow {
  id: string;
  customer: string;
  status: string;
  /** Semantic status token classes (kept in lockstep with status-colors.ts) */
  statusClasses: string;
  total: string;
  date: string;
}

export const orderRows: OrderRow[] = [
  {
    id: "#ORD-001",
    customer: "Nguyễn Thị A",
    status: "Delivered",
    statusClasses: "bg-success-soft text-success border-success/20",
    total: "485,000₫",
    date: "20/03/2026",
  },
  {
    id: "#ORD-002",
    customer: "Trần Văn B",
    status: "Processing",
    statusClasses: "bg-info-soft text-info border-info/20",
    total: "250,000₫",
    date: "20/03/2026",
  },
  {
    id: "#ORD-003",
    customer: "Lê Thị C",
    status: "Pending",
    statusClasses: "bg-warning-soft text-warning border-warning/20",
    total: "1,200,000₫",
    date: "19/03/2026",
  },
  {
    id: "#ORD-004",
    customer: "Phạm Minh D",
    status: "Cancelled",
    statusClasses: "bg-destructive-soft text-destructive border-destructive/20",
    total: "320,000₫",
    date: "19/03/2026",
  },
];
