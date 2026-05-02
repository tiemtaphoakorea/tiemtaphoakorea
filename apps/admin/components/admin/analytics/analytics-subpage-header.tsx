import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface AnalyticsSubpageHeaderProps {
  title: string;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export function AnalyticsSubpageHeader({
  title,
  actions,
  backHref,
  backLabel,
}: AnalyticsSubpageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={backHref ?? ADMIN_ROUTES.ANALYTICS}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel ?? "Báo cáo"}
        </Link>
        <span className="select-none text-muted-foreground/30">/</span>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
    </div>
  );
}
