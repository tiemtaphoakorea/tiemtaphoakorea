import type { Product } from "@workspace/shared/types/product";

interface ProductDescriptionPaneProps {
  product: Product;
}

export function ProductDescriptionPane({ product }: ProductDescriptionPaneProps) {
  const firstVariant = product.variants[0];
  const totalStock = product.variants.reduce((sum, v) => sum + (v.onHand ?? 0), 0);

  const specs: Array<[string, string]> = [
    ["Danh mục", product.category?.name || "—"],
    ["Mã sản phẩm", firstVariant?.sku || product.id.slice(0, 8)],
    ["Số phân loại", String(product.variants.length)],
    ["Tồn kho", `${totalStock} sản phẩm`],
    ["Xuất xứ", "🇰🇷 Hàn Quốc"],
    ["Nhập khẩu", "Chính ngạch · có tem phụ"],
  ];

  return (
    <div className="grid grid-cols-1 gap-8 py-6 lg:grid-cols-2">
      <div>
        <h3 className="mb-3 text-lg font-bold tracking-tight text-foreground">Về sản phẩm</h3>
        {product.description ? (
          <p className="whitespace-pre-line text-sm leading-[1.7] text-muted-foreground">
            {product.description}
          </p>
        ) : (
          <p className="text-sm italic leading-[1.7] text-muted-foreground">
            Đang cập nhật nội dung mô tả chi tiết.
          </p>
        )}
        <div className="mt-3.5 rounded-xl bg-secondary/60 p-4 text-xs leading-[1.6] text-muted-foreground">
          <b className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-foreground">
            Cam kết
          </b>
          Hàng nhập khẩu chính ngạch từ Hàn Quốc, có tem phụ tiếng Việt, hóa đơn VAT và chứng nhận
          kiểm định. Bảo quản nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp.
        </div>
      </div>
      <div>
        <table className="w-full border-collapse text-[13px]">
          <tbody>
            {specs.map(([k, v]) => (
              <tr key={k} className="border-b border-border last:border-b-0">
                <td className="w-[140px] py-2.5 font-medium text-muted-foreground">{k}</td>
                <td className="py-2.5 font-semibold text-foreground">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
