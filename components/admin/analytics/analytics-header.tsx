"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Calendar, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyticsHeaderProps {
  data: any;
}

export function AnalyticsHeader({ data }: AnalyticsHeaderProps) {
  const currentYear = new Date().getFullYear();

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add unicode font support if needed, but for now we'll stick to standard fonts or add a font if Vietnamese characters break.
    // Standard fonts like 'helvetica' might not support full Vietnamese characters well without a custom font.
    // For simplicity in this iteration, we will use standard text but be aware of encoding.
    // Actually, jspdf default fonts don't support Vietnamese well. We might need to keep it simple or use English for headers if it breaks,
    // or just try to see if it works.
    // 'jspdf' supports UTF-8 but standard fonts (Helvetica, Times) do not support all Unicode chars.
    // However, I will implement the logic first.

    // Title
    doc.setFontSize(20);
    doc.text("Analytics Report", 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // KPI Section
    doc.setFontSize(14);
    doc.text("Overview", 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        [
          "Total Revenue",
          `${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.totalRevenue)}`,
        ],
        ["Total Orders", data.totalOrders],
        ["Total Customers", data.totalCustomers],
      ],
    });

    // Monthly Revenue
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Monthly Revenue", 14, finalY);

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Month", "Revenue", "Orders"]],
      body: data.monthlyRevenue.map((item: any) => [
        item.month,
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(item.revenue),
        item.orders,
      ]),
    });

    // Save
    doc.save(`analytics_report_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Báo cáo & Phân tích
        </h1>
        <p className="mt-1 font-medium text-slate-500 dark:text-slate-400">
          Dữ liệu hiệu suất kinh doanh năm {currentYear}.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-11 gap-2 border-slate-200 font-bold dark:border-slate-800"
        >
          <Calendar className="h-4 w-4" />
          {currentYear}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <Button
          onClick={handleExportPDF}
          className="shadow-primary/20 h-11 gap-2 px-6 font-bold shadow-lg"
        >
          <Download className="h-5 w-5" />
          Tải báo cáo (PDF)
        </Button>
      </div>
    </div>
  );
}
