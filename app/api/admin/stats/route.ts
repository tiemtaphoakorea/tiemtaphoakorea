import { NextResponse } from "next/server";
import { getInternalUser } from "@/lib/auth.server";
import { HTTP_STATUS } from "@/lib/http-status";
import {
  getDashboardStats,
  getKPIStats,
  getRecentOrders,
  getTopProducts,
} from "@/services/dashboard.server";

export async function GET(request: Request) {
  const user = await getInternalUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: HTTP_STATUS.UNAUTHORIZED });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section");

  try {
    if (section === "kpi") {
      const kpiStats = await getKPIStats();
      return NextResponse.json({ kpiStats });
    }

    if (section === "recent-orders") {
      const recentOrders = await getRecentOrders();
      return NextResponse.json({ recentOrders });
    }

    if (section === "top-products") {
      const topProducts = await getTopProducts();
      return NextResponse.json({ topProducts });
    }

    const stats = await getDashboardStats();
    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      {
        error: "Đã có lỗi xảy ra khi tải thống kê.",
      },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
