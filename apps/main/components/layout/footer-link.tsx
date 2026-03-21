import { PUBLIC_ROUTES } from "@workspace/shared/routes";
import Link from "next/link";

export function FooterLink({ label }: { label: string }) {
  return (
    <li>
      <Link
        href={PUBLIC_ROUTES.HOME}
        className="text-muted-foreground hover:text-primary text-sm font-semibold transition-colors"
      >
        {label}
      </Link>
    </li>
  );
}
