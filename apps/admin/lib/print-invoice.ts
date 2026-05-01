import DOMPurify from "dompurify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type ShopInfo = {
  name: string;
  address: string;
  phone: string;
  taxId: string;
};

const FALLBACK_SHOP_INFO: ShopInfo = {
  name: "Cửa hàng",
  address: "",
  phone: "",
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
  shippingFee?: string | number | null;
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

function buildInvoiceHTML(order: InvoiceOrder, shop: ShopInfo): string {
  const discount = Number(order.discount ?? 0);
  const shippingFee = Number(order.shippingFee ?? 0);
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
      <div class="inv-shop-name">${esc(shop.name || FALLBACK_SHOP_INFO.name)}</div>
      <div class="inv-shop-info">
        ${shop.address ? `${esc(shop.address)}<br>` : ""}
        ${shop.phone ? `Tel: ${esc(shop.phone)}` : ""}
        ${shop.taxId ? `<br>MST: ${esc(shop.taxId)}` : ""}
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
        ${shippingFee > 0 ? `<div class="inv-row"><span>Phí ship trả hộ</span><span>${formatVND(shippingFee)}</span></div>` : ""}
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

async function renderInvoiceCanvas(
  order: InvoiceOrder,
  shop: ShopInfo,
): Promise<{ canvas: HTMLCanvasElement; cleanup: () => void }> {
  const styleEl = document.createElement("style");
  styleEl.textContent = INVOICE_CSS;
  document.head.appendChild(styleEl);

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;top:0;left:-9999px;background:#fff;";
  container.appendChild(parseSafeHTML(buildInvoiceHTML(order, shop)));
  document.body.appendChild(container);

  await new Promise<void>((r) => requestAnimationFrame(() => r()));
  await new Promise((r) => setTimeout(r, 150));

  const pageEl = container.querySelector<HTMLElement>(".inv-page")!;
  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  return {
    canvas,
    cleanup: () => {
      document.body.removeChild(container);
      document.head.removeChild(styleEl);
    },
  };
}

export async function printInvoice(order: InvoiceOrder, shop: ShopInfo): Promise<void> {
  const { canvas, cleanup } = await renderInvoiceCanvas(order, shop);
  try {
    const mmW = 80;
    const mmH = (canvas.height * mmW) / canvas.width;
    const pdf = new jsPDF({ unit: "mm", format: [mmW, mmH] });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, mmW, mmH);
    pdf.save(`hoa-don-${order.orderNumber}.pdf`);
  } finally {
    cleanup();
  }
}

export async function exportInvoiceImage(order: InvoiceOrder, shop: ShopInfo): Promise<void> {
  const { canvas, cleanup } = await renderInvoiceCanvas(order, shop);
  try {
    const link = document.createElement("a");
    link.download = `hoa-don-${order.orderNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    cleanup();
  }
}

export async function copyInvoiceImage(order: InvoiceOrder, shop: ShopInfo): Promise<void> {
  const blobPromise = renderInvoiceCanvas(order, shop).then(
    ({ canvas, cleanup }) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => {
          cleanup();
          b ? resolve(b) : reject(new Error("Canvas toBlob failed"));
        }, "image/png"),
      ),
  );
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blobPromise })]);
}

/**
 * Fetch shop info from settings API. Falls back to empty config on error.
 * Cached at module level so repeated invoice exports skip the network round-trip.
 */
let shopInfoCache: ShopInfo | null = null;
export async function getShopInfo(): Promise<ShopInfo> {
  if (shopInfoCache) return shopInfoCache;
  try {
    const res = await fetch("/api/admin/settings/shop-info", { credentials: "include" });
    if (!res.ok) return FALLBACK_SHOP_INFO;
    const data = (await res.json()) as ShopInfo;
    shopInfoCache = {
      name: data.name || FALLBACK_SHOP_INFO.name,
      address: data.address ?? "",
      phone: data.phone ?? "",
      taxId: data.taxId ?? "",
    };
    return shopInfoCache;
  } catch {
    return FALLBACK_SHOP_INFO;
  }
}

export function clearShopInfoCache(): void {
  shopInfoCache = null;
}
