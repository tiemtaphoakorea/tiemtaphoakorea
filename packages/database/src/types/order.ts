import type { InferSelectModel } from "drizzle-orm";
import type { orderItems, orders, productVariants } from "../schema";

export type Order = InferSelectModel<typeof orders>;
export type OrderItem = InferSelectModel<typeof orderItems>;
export type ProductVariant = InferSelectModel<typeof productVariants>;

export type CreateOrderInput = {
  customerId: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  note?: string;
  userId: string;
  deliveryPreference: "ship_together" | "ship_available_first";
};

export interface OrderBuilderItem {
  variantId: string;
  variantName: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface OrderItemTableItem extends OrderBuilderItem {
  productId: string;
  image?: string;
}

export interface OrderProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: number;
  images: Array<{
    imageUrl: string;
  }>;
}

export interface OrderProductSelection {
  id: string;
  name: string;
  thumbnail?: string | null;
  variants: OrderProductVariant[];
}
