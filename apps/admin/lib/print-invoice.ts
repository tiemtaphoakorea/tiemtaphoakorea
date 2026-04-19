import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const SHOP_INFO = {
  name: "Hoa Tâm Tâm Korea",
  address: "123 Đường ABC, Phường XYZ, TP.HCM",
  phone: "0909 000 000",
  taxId: "",
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function esc(str: string | null | undefined): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface InvoiceOrder {
  orderNumber: string | number;
  createdAt: Date | string;
  customer: {
    fullName: string;
    phone?: string | null;
    address?: string | null;
  };
  items: Array<{
    productName: string;
    variantName: string;
    sku: string;
    quantity: number;
    unitPrice: string | number;
    lineTotal: string | number;
  }>;
  subtotal: string | number;
  discount?: string | number | null;
  total: string | number;
  paidAmount?: string | number | null;
  adminNote?: string | null;
}

const INVOICE_CSS = `
  .inv-page { width: 302px; padding: 12px 10px; font-family: Arial, sans-serif; font-size: 12px; color: #000; background: #fff; }
  .inv-shop-name { font-size: 16px; font-weight: 900; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
  .inv-shop-info { font-size: 10px; text-align: center; color: #555; margin-top: 3px; line-height: 1.5; }
  .inv-divider { border: none; border-top: 1px dashed #aaa; margin: 8px 0; }
  .inv-title { font-size: 13px; font-weight: 900; text-align: center; text-transform: uppercase; }
  .inv-meta { font-size: 11px; text-align: center; color: #444; margin-bottom: 6px; }
  .inv-customer { font-size: 11px; margin-bottom: 6px; line-height: 1.7; }
  .inv-customer b { font-weight: 700; }
  .inv-table { width: 100%; border-collapse: collapse; margin: 4px 0; }
  .inv-table th { font-size: 10px; font-weight: 700; text-align: left; border-bottom: 1px solid #000; padding: 3px 2px 4px; }
  .inv-table td { font-size: 11px; padding: 4px 2px; vertical-align: top; border-bottom: 1px dotted #ccc; }
  .inv-c { text-align: center; }
  .inv-r { text-align: right; }
  .inv-pname { font-weight: 700; }
  .inv-sku { font-size: 9px; color: #666; }
  .inv-totals { margin-top: 6px; }
  .inv-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
  .inv-grand { font-weight: 900; font-size: 13px; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
  .inv-note { font-size: 10px; color: #555; margin-top: 6px; font-style: italic; }
  .inv-sig { display: flex; justify-content: space-between; margin-top: 18px; font-size: 10px; }
  .inv-sig-col { text-align: center; width: 45%; }
  .inv-sig-label { font-weight: 700; margin-bottom: 28px; }
  .inv-sig-line { border-top: 1px solid #aaa; padding-top: 3px; font-size: 9px; color: #888; }
  .inv-footer { text-align: center; font-size: 10px; color: #666; margin-top: 12px; }
`;

function buildInvoiceHTML(order: InvoiceOrder): string {
  const discount = Number(order.discount ?? 0);
  const paid = Number(order.paidAmount ?? 0);
  const remaining = Math.max(0, Number(order.total) - paid);

  const rows = order.items
    .map(
      (item, i) => `
      <tr>
        <td class="inv-c">${i + 1}</td>
        <td>
          <div class="inv-pname">${esc(item.productName)}</div>
          <div class="inv-sku">${item.variantName !== item.productName ? `${esc(item.variantName)} · ` : ""}${esc(item.sku)}</div>
        </td>
        <td class="inv-r">${formatVND(Number(item.unitPrice))}</td>
        <td class="inv-c">${item.quantity}</td>
        <td class="inv-r">${formatVND(Number(item.lineTotal))}</td>
      </tr>`,
    )
    .join("");

  return `
    <div class="inv-page">
      <div class="inv-shop-name">${esc(SHOP_INFO.name)}</div>
      <div class="inv-shop-info">
        ${SHOP_INFO.address ? `${esc(SHOP_INFO.address)}<br>` : ""}
        ${SHOP_INFO.phone ? `Tel: ${esc(SHOP_INFO.phone)}` : ""}
        ${SHOP_INFO.taxId ? `<br>MST: ${esc(SHOP_INFO.taxId)}` : ""}
      </div>
      <hr class="inv-divider" />
      <div class="inv-title">Hóa đơn bán hàng</div>
      <div class="inv-meta">Số: <b>#${esc(String(order.orderNumber))}</b> &nbsp;|&nbsp; ${formatDateTime(order.createdAt)}</div>
      <hr class="inv-divider" />
      <div class="inv-customer">
        <b>Khách hàng:</b> ${esc(order.customer.fullName)}<br>
        ${order.customer.phone ? `<b>SĐT:</b> ${esc(order.customer.phone)}<br>` : ""}
        ${order.customer.address ? `<b>Địa chỉ:</b> ${esc(order.customer.address)}` : ""}
      </div>
      <table class="inv-table">
        <thead>
          <tr>
            <th class="inv-c" style="width:18px">#</th>
            <th>Sản phẩm</th>
            <th class="inv-r" style="width:60px">Đơn giá</th>
            <th class="inv-c" style="width:22px">SL</th>
            <th class="inv-r" style="width:64px">Thành tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <hr class="inv-divider" />
      <div class="inv-totals">
        <div class="inv-row"><span>Tạm tính</span><span>${formatVND(Number(order.subtotal))}</span></div>
        ${discount > 0 ? `<div class="inv-row"><span>Giảm giá</span><span>- ${formatVND(discount)}</span></div>` : ""}
        <div class="inv-row inv-grand"><span>Tổng cộng</span><span>${formatVND(Number(order.total))}</span></div>
        ${paid > 0 ? `<div class="inv-row"><span>Đã thanh toán</span><span>${formatVND(paid)}</span></div>` : ""}
        ${remaining > 0 ? `<div class="inv-row"><span><b>Còn lại</b></span><span><b>${formatVND(remaining)}</b></span></div>` : ""}
      </div>
      ${order.adminNote ? `<div class="inv-note">Ghi chú: ${esc(order.adminNote)}</div>` : ""}
      <hr class="inv-divider" />
      <div class="inv-sig">
        <div class="inv-sig-col">
          <div class="inv-sig-label">Người bán</div>
          <div class="inv-sig-line">(Ký, ghi rõ họ tên)</div>
        </div>
        <div class="inv-sig-col">
          <div class="inv-sig-label">Người mua</div>
          <div class="inv-sig-line">(Ký, ghi rõ họ tên)</div>
        </div>
      </div>
      <div class="inv-footer">Cảm ơn quý khách đã mua hàng!</div>
    </div>
  `;
}

function parseSafeHTML(html: string): DocumentFragment {
  const clean = DOMPurify.sanitize(html, { RETURN_DOM_FRAGMENT: true });
  return document.importNode(clean, true) as unknown as DocumentFragment;
}

export async function printInvoice(order: InvoiceOrder): Promise<void> {
  const styleEl = document.createElement("style");
  styleEl.textContent = INVOICE_CSS;
  document.head.appendChild(styleEl);

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:0;left:-9999px;background:#fff;";
  container.appendChild(parseSafeHTML(buildInvoiceHTML(order)));
  document.body.appendChild(container);

  try {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise((r) => setTimeout(r, 150));

    const pageEl = container.querySelector<HTMLElement>(".inv-page")!;
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const mmW = 80;
    const mmH = (canvas.height * mmW) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: [mmW, mmH] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, mmW, mmH);
    pdf.save(`hoa-don-${order.orderNumber}.pdf`);
  } finally {
    document.body.removeChild(container);
    document.head.removeChild(styleEl);
  }
}
