"use client";

import type { Product } from "@workspace/shared/types/product";
import { useState } from "react";
import { ProductDescriptionPane } from "./product-description-pane";
import { ProductPolicyPane } from "./product-policy-pane";
import { ProductReviewsPane } from "./product-reviews-pane";

type TabKey = "desc" | "reviews" | "policy";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "desc", label: "Mô tả sản phẩm" },
  { key: "reviews", label: "Đánh giá" },
  { key: "policy", label: "Chính sách mua hàng" },
];

interface ProductDetailTabsProps {
  product: Product;
}

export function ProductDetailTabs({ product }: ProductDetailTabsProps) {
  const [active, setActive] = useState<TabKey>("desc");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex border-b-2 border-border">
        {TABS.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`-mb-[2px] border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {active === "desc" && <ProductDescriptionPane product={product} />}
      {active === "reviews" && <ProductReviewsPane />}
      {active === "policy" && <ProductPolicyPane />}
    </div>
  );
}
