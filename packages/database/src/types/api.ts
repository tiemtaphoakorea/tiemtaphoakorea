/**
 * Common API types to replace 'any' in client services and API routes
 */

import type { orderItems, orderStatusHistory, payments } from "../schema/orders";
import type { products, productVariants } from "../schema/products";
import type { profiles } from "../schema/profiles";

export type ApiRouteParams<TParams extends Record<string, string> = Record<string, string>> = {
  params: Promise<TParams>;
};

export type IdRouteParams = ApiRouteParams<{ id: string }>;

/**
 * Message types for chat
 */
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  createdAt: Date | null;
  readAt: Date | null;
  sender?: {
    id: string;
    fullName: string | null;
    role: string | null;
  };
}

/**
 * Product with variants for product listing/selection
 */
export interface ProductWithVariants {
  id: string;
  name: string;
  slug: string;
  thumbnail?: string | null;
  description: string | null;
  isActive: boolean | null;
  variants: Array<{
    id: string;
    productId: string;
    sku: string;
    name: string;
    price: string;
    costPrice: string | null;
    onHand: number;
    reserved: number;
    images: Array<{
      imageUrl: string;
    }>;
  }>;
}

/**
 * Order with full details including items, customer, payments, history
 */
export interface OrderDetails {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  subtotal: string;
  discount: string;
  total: string;
  totalCost: string;
  profit: string;
  paidAmount: string;
  adminNote: string | null;
  customerNote: string | null;
  deliveryPreference: string | null;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  customer?: typeof profiles.$inferSelect;
  items?: Array<
    typeof orderItems.$inferSelect & {
      variant?: typeof productVariants.$inferSelect & {
        product?: typeof products.$inferSelect;
      };
    }
  >;
  payments?: Array<
    typeof payments.$inferSelect & {
      creator?: typeof profiles.$inferSelect;
    }
  >;
  statusHistory?: Array<
    typeof orderStatusHistory.$inferSelect & {
      creator?: typeof profiles.$inferSelect;
    }
  >;
}

/**
 * User profile data returned from API
 */
export interface UserProfileResponse {
  profile: typeof profiles.$inferSelect;
  password?: string;
}

/**
 * Product creation/update response
 */
export interface ProductResponse {
  success: boolean;
  product: typeof products.$inferSelect & {
    variants?: Array<typeof productVariants.$inferSelect>;
  };
}
