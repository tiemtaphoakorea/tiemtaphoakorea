"use client";

import { ADMIN_ROUTES } from "@workspace/shared/routes";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Clock,
  CreditCard,
  HandCoins,
  type LucideIcon,
  Package,
  PackagePlus,
  PackageSearch,
  Receipt,
  Repeat,
  ScrollText,
  ShoppingBag,
  Store,
  TrendingUp,
  TriangleAlert,
  Truck,
  User,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

type ReportItem = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
};

type ReportGroup = {
  label: string;
  description: string;
  items: ReportItem[];
};

const REPORT_GROUPS: ReportGroup[] = [
  {
    label: "Báo cáo bán hàng",
    description: "Doanh thu, đơn hàng, thanh toán theo nhiều chiều phân tích.",
    items: [
      {
        href: ADMIN_ROUTES.REPORTS_SALES_BY_TIME,
        title: "Doanh thu theo thời gian",
        description: "Doanh thu, lợi nhuận theo ngày/tuần/tháng — so sánh kỳ trước.",
        icon: Clock,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_BY_STAFF,
        title: "Doanh thu theo nhân viên",
        description: "Xếp hạng nhân viên bán hàng theo doanh thu, đơn, lợi nhuận.",
        icon: User,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_BY_PRODUCT,
        title: "Doanh thu theo sản phẩm",
        description: "Top sản phẩm/biến thể bán chạy với doanh thu và lợi nhuận.",
        icon: Package,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_BY_CUSTOMER,
        title: "Doanh thu theo khách hàng",
        description: "Khách hàng đóng góp doanh thu cao nhất trong kỳ.",
        icon: Users,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_BY_ORDER,
        title: "Chi tiết theo đơn hàng",
        description: "Liệt kê đơn hàng trong kỳ với trạng thái thanh toán/giao hàng.",
        icon: ShoppingBag,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_PAYMENTS_BY_METHOD,
        title: "Thu tiền theo phương thức",
        description: "Tiền mặt, chuyển khoản, thẻ — số giao dịch và tỷ trọng.",
        icon: CreditCard,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_PAYMENTS_BY_STAFF,
        title: "Thu tiền theo nhân viên",
        description: "Nhân viên thu ngân nào thu nhiều nhất, số giao dịch và TB/giao dịch.",
        icon: HandCoins,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SALES_PAYMENTS_BY_TIME,
        title: "Thu tiền theo thời gian",
        description: "Tổng thu phân theo ngày/tuần/tháng, breakdown theo phương thức.",
        icon: BarChart3,
        iconClass: "bg-emerald-500/10 text-emerald-500",
      },
    ],
  },
  {
    label: "Báo cáo nhập hàng",
    description: "Kiểm soát nhập kho và thanh toán nhà cung cấp.",
    items: [
      {
        href: ADMIN_ROUTES.REPORTS_PURCHASES_BY_TIME,
        title: "Nhập hàng theo thời gian",
        description: "Số phiếu, số lượng, giá trị nhập theo ngày/tuần/tháng.",
        icon: Clock,
        iconClass: "bg-orange-500/10 text-orange-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_PURCHASES_BY_SUPPLIER,
        title: "Nhập hàng theo nhà cung cấp",
        description: "Top NCC theo giá trị nhập, đã trả, còn nợ.",
        icon: Store,
        iconClass: "bg-orange-500/10 text-orange-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_PURCHASES_BY_PRODUCT,
        title: "Nhập hàng theo sản phẩm",
        description: "Top sản phẩm nhập, giá nhập trung bình, WAC hiện tại.",
        icon: PackagePlus,
        iconClass: "bg-orange-500/10 text-orange-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_PURCHASES_BY_STAFF,
        title: "Nhập hàng theo nhân viên",
        description: "Nhân viên tạo phiếu nhập nhiều nhất theo giá trị và số phiếu.",
        icon: ClipboardList,
        iconClass: "bg-orange-500/10 text-orange-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_PURCHASES_PAYOUTS_BY_METHOD,
        title: "Chi trả NCC theo phương thức",
        description: "Tiền mặt, chuyển khoản, thẻ — tổng chi cho NCC theo phương thức.",
        icon: Wallet,
        iconClass: "bg-orange-500/10 text-orange-500",
      },
    ],
  },
  {
    label: "Báo cáo kho",
    description: "Tồn kho, sổ kho, dịch chuyển hàng hóa và cảnh báo hết hàng.",
    items: [
      {
        href: ADMIN_ROUTES.REPORTS_INVENTORY_CURRENT_STOCK,
        title: "Tồn kho hiện tại",
        description: "Số lượng và giá trị kho theo SKU/danh mục, % đóng góp.",
        icon: Boxes,
        iconClass: "bg-blue-500/10 text-blue-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_INVENTORY_LEDGER,
        title: "Sổ kho",
        description: "Nhật ký nhập-xuất chi tiết theo từng sản phẩm/biến thể.",
        icon: ScrollText,
        iconClass: "bg-blue-500/10 text-blue-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_INVENTORY_IN_OUT_MOVEMENT,
        title: "Xuất nhập tồn",
        description: "Tồn đầu — nhập — xuất — tồn cuối theo kỳ, so sánh kỳ trước.",
        icon: Repeat,
        iconClass: "bg-blue-500/10 text-blue-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_INVENTORY_LOW_STOCK,
        title: "Cảnh báo hết hàng",
        description: "Sản phẩm dưới ngưỡng tồn tối thiểu, cần nhập bổ sung.",
        icon: TriangleAlert,
        iconClass: "bg-blue-500/10 text-blue-500",
      },
    ],
  },
  {
    label: "Báo cáo khách hàng",
    description: "Phân tích hành vi và giá trị khách hàng.",
    items: [
      {
        href: ADMIN_ROUTES.REPORTS_CUSTOMERS_TOP_BY_REVENUE,
        title: "Top khách theo doanh thu",
        description: "Khách hàng VIP — đóng góp doanh thu nhiều nhất.",
        icon: TrendingUp,
        iconClass: "bg-purple-500/10 text-purple-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_CUSTOMERS_TOP_BY_ORDERS,
        title: "Top khách theo số đơn",
        description: "Khách hàng mua sắm thường xuyên nhất.",
        icon: ShoppingBag,
        iconClass: "bg-purple-500/10 text-purple-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_CUSTOMERS_BY_PRODUCT,
        title: "Khách hàng theo sản phẩm",
        description: "Sản phẩm nào kéo nhiều khách nhất, ai đã mua sản phẩm X.",
        icon: PackageSearch,
        iconClass: "bg-purple-500/10 text-purple-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_CUSTOMERS_NEW_VS_RETURNING,
        title: "Khách mới vs quay lại",
        description: "Tỷ lệ khách mới và quay lại trong kỳ, doanh thu đóng góp.",
        icon: UserPlus,
        iconClass: "bg-purple-500/10 text-purple-500",
      },
    ],
  },
  {
    label: "Báo cáo tài chính",
    description: "Lãi lỗ, công nợ, dòng tiền — theo dõi sức khỏe tài chính.",
    items: [
      {
        href: ADMIN_ROUTES.REPORTS_PROFIT_LOSS,
        title: "Báo cáo lãi lỗ",
        description: "Doanh thu, giá vốn, lợi nhuận gộp/ròng — so sánh kỳ trước.",
        icon: TrendingUp,
        iconClass: "bg-rose-500/10 text-rose-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_PROFIT_LOSS_BY_ORDER,
        title: "Lợi nhuận theo đơn hàng",
        description: "Chi tiết lợi nhuận từng đơn và từng dòng sản phẩm trong đơn.",
        icon: Receipt,
        iconClass: "bg-rose-500/10 text-rose-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_CUSTOMER_DEBTS,
        title: "Công nợ khách hàng",
        description: "Nợ đầu kỳ + tăng − giảm = nợ cuối kỳ. Drill-down từng khách.",
        icon: Receipt,
        iconClass: "bg-rose-500/10 text-rose-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_SUPPLIER_DEBTS,
        title: "Công nợ nhà cung cấp",
        description: "Tiền phải trả NCC — nhập tăng nợ, phiếu chi giảm nợ.",
        icon: Truck,
        iconClass: "bg-rose-500/10 text-rose-500",
      },
      {
        href: ADMIN_ROUTES.REPORTS_CASH_FLOW,
        title: "Báo cáo dòng tiền",
        description: "Tiền vào (thu KH) − tiền ra (chi NCC + chi phí) = chênh lệch.",
        icon: Wallet,
        iconClass: "bg-rose-500/10 text-rose-500",
      },
    ],
  },
];

export default function ReportsHubContent() {
  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Báo cáo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          26 báo cáo Sapo-style phân theo 5 nhóm: bán hàng, nhập hàng, kho, khách hàng, tài chính.
        </p>
      </div>

      {REPORT_GROUPS.map((group) => (
        <section key={group.label} className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{group.label}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{group.description}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map(({ href, title, description, icon: Icon, iconClass }) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex items-start gap-4">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold">{title}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
