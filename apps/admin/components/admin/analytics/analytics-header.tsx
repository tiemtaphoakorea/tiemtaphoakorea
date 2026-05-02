"use client";

import { Button } from "@workspace/ui/components/button";
import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Calendar, ChevronDown, Download } from "lucide-react";
import { useState } from "react";

interface AnalyticsHeaderProps {
  data: any;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function esc(str: string | null | undefined): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const REPORT_CSS = `
  .rpt-page { width: 794px; padding: 40px 53px; font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; min-height: 1123px; box-sizing: border-box; }
  .rpt-h1 { font-size: 18px; font-weight: 900; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
  .rpt-sub { font-size: 11px; color: #555; text-align: center; margin-top: 5px; }
  .rpt-divider { border: none; border-top: 1.5px solid #000; margin: 10mm 0 8mm; }
  .rpt-section { font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 4mm; }
  .rpt-table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
  .rpt-table th { background: #323232; color: #fff; font-weight: 700; font-size: 11px; padding: 8px 10px; text-align: left; }
  .rpt-table td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; font-size: 11px; }
  .rpt-alt { background: #f5f5f5; }
  .rpt-bold { font-weight: 700; }
  .rpt-r { text-align: right; }
  .rpt-c { text-align: center; }
  .rpt-footer { border-top: 1px solid #ccc; padding-top: 3mm; display: flex; justify-content: space-between; font-size: 9px; color: #999; margin-top: 10mm; }
`;

function buildReportHTML(data: any, year: number): string {
  const dateStr = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const overviewRows = [
    ["Tổng doanh thu", formatVND(data?.totalRevenue ?? 0)],
    ["Tổng đơn hàng", String(data?.totalOrders ?? 0)],
    ["Tổng khách hàng", String(data?.totalCustomers ?? 0)],
  ]
    .map(
      ([label, value], i) => `
      <tr class="${i % 2 === 1 ? "rpt-alt" : ""}">
        <td class="rpt-bold" style="width:50%">${esc(label)}</td>
        <td class="rpt-r">${esc(value)}</td>
      </tr>`,
    )
    .join("");

  const monthlyRows = (data?.monthlyRevenue ?? [])
    .map(
      (item: any, i: number) => `
      <tr class="${i % 2 === 1 ? "rpt-alt" : ""}">
        <td class="rpt-bold">${esc(item.month)}</td>
        <td class="rpt-r">${esc(formatVND(item.revenue ?? 0))}</td>
        <td class="rpt-c">${item.orders ?? 0}</td>
        <td class="rpt-r">${item.orders > 0 ? esc(formatVND(Math.round(item.revenue / item.orders))) : "&mdash;"}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="rpt-page">
      <div class="rpt-h1">Báo cáo phân tích kinh doanh</div>
      <div class="rpt-sub">Năm ${year} &nbsp;|&nbsp; Xuất ngày: ${dateStr}</div>
      <hr class="rpt-divider" />
      <div class="rpt-section">I. Tổng quan</div>
      <table class="rpt-table">
        <thead><tr><th style="width:50%">Chỉ số</th><th>Giá trị</th></tr></thead>
        <tbody>${overviewRows}</tbody>
      </table>
      <div class="rpt-section">II. Doanh thu theo tháng</div>
      <table class="rpt-table">
        <thead>
          <tr>
            <th>Tháng</th>
            <th class="rpt-r">Doanh thu</th>
            <th class="rpt-c">Đơn hàng</th>
            <th class="rpt-r">Trung bình / đơn</th>
          </tr>
        </thead>
        <tbody>${monthlyRows}</tbody>
      </table>
      <div class="rpt-footer">
        <span>Hoa Tâm Tâm Korea — Hệ thống quản lý bán hàng</span>
        <span>Trang 1 / 1</span>
      </div>
    </div>
  `;
}

function parseSafeHTML(html: string): DocumentFragment {
  const clean = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  return document.importNode(clean, true) as unknown as DocumentFragment;
}

export function AnalyticsHeader({ data }: AnalyticsHeaderProps) {
  const currentYear = new Date().getFullYear();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);

    const styleEl = document.createElement("style");
    styleEl.textContent = REPORT_CSS;
    document.head.appendChild(styleEl);

    const container = document.createElement("div");
    container.style.cssText = "position:fixed;top:0;left:-9999px;background:#fff;";
    container.appendChild(parseSafeHTML(buildReportHTML(data, currentYear)));
    document.body.appendChild(container);

    try {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise((r) => setTimeout(r, 150));

      const pageEl = container.querySelector<HTMLElement>(".rpt-page")!;
      const canvas = await html2canvas(pageEl, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 794,
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`bao-cao-phan-tich-${new Date().toISOString().split("T")[0]}.pdf`);
    } finally {
      document.body.removeChild(container);
      document.head.removeChild(styleEl);
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Báo cáo & Thống kê</h1>
        <p className="mt-1 font-medium text-slate-500">
          Dữ liệu hiệu suất kinh doanh năm {currentYear}.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="h-11 gap-2 border-slate-200 font-bold">
          <Calendar className="h-4 w-4" />
          {currentYear}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="shadow-primary/20 h-11 gap-2 px-6 font-bold shadow-lg"
        >
          <Download className="h-5 w-5" />
          {isExporting ? "Đang xuất..." : "Export PDF"}
        </Button>
      </div>
    </div>
  );
}
