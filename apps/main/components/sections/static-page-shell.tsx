import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type StaticPageShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function StaticPageShell({ title, description, children }: StaticPageShellProps) {
  return (
    <article className="container mx-auto px-4 py-10 md:py-14">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href={PUBLIC_ROUTES.HOME} className="hover:text-foreground">
          Trang chủ
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{title}</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        )}
      </header>

      <div
        className="mt-8 max-w-3xl space-y-5 text-[15px] leading-relaxed text-foreground/85
          [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground
          [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground
          [&_p]:my-3
          [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6
          [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6
          [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/80"
      >
        {children}
      </div>
    </article>
  );
}
