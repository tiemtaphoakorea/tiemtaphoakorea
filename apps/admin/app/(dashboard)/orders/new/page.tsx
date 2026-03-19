import { OrderBuilder } from "@/components/admin/orders/create/order-builder";

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Tạo đơn hàng mới
          </h1>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
            Tạo đơn hàng thủ công cho khách hàng tại quầy hoặc qua điện thoại.
          </p>
        </div>
      </div>

      <OrderBuilder />
    </div>
  );
}
