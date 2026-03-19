import { ACCOUNT_ROUTES } from "@repo/shared/routes";
import Link from "next/link";

export default function AccountOrdersPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-black">Đơn hàng của tôi</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">
        Tính năng lịch sử đơn hàng sẽ sớm được cập nhật trong khu vực tài khoản.
      </p>
      <Link
        href={ACCOUNT_ROUTES.ROOT}
        className="mt-8 inline-flex rounded-xl border border-slate-200 px-4 py-2 font-bold hover:bg-slate-50"
      >
        Về trang tài khoản
      </Link>
    </section>
  );
}
