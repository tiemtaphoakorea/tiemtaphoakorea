import Link from "next/link";
import { ACCOUNT_ROUTES } from "@/lib/routes";

export default function AccountOverviewPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-black">Tài khoản của bạn</h1>
      <p className="text-muted-foreground mt-3 max-w-2xl">
        Khu vực tài khoản đang được hoàn thiện. Bạn vẫn có thể truy cập nhanh các mục bên dưới.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href={ACCOUNT_ROUTES.ORDERS}
          className="rounded-2xl border border-slate-200 p-5 font-bold hover:bg-slate-50"
        >
          Đơn hàng của tôi
        </Link>
        <Link
          href={ACCOUNT_ROUTES.CHAT}
          className="rounded-2xl border border-slate-200 p-5 font-bold hover:bg-slate-50"
        >
          Chat với shop
        </Link>
      </div>
    </section>
  );
}
