import Link from "next/link";
import { PUBLIC_ROUTES } from "@/lib/routes";

export function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <Link
      href={PUBLIC_ROUTES.HOME}
      className="bg-primary/5 text-primary hover:bg-primary flex h-10 w-10 transform items-center justify-center rounded-full transition-all hover:-translate-y-1 hover:text-white"
    >
      {icon}
    </Link>
  );
}
