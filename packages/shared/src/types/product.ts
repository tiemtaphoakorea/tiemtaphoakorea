export interface VariantImage {
  imageUrl: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  onHand: number;
  stockType?: string | null;
  images: VariantImage[];
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  basePrice: string | number;
  variants: ProductVariant[];
  category?: {
    name: string;
    slug: string;
  } | null;
}

export type ProductSort = "latest" | "price-asc" | "price-desc";

export interface ProductFilterCategory {
  name: string;
  slug: string;
  children?: ProductFilterCategory[];
}

// Product form (admin create/edit)
export type ProductFormCategory = {
  id: string;
  name: string;
  depth?: number;
};

export type ProductFormVariant = {
  id: string; // temp or real
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  onHand: number;
  /** Số tồn tối đa (kể cả) để vẫn coi là "sắp hết" — theo từng biến thể. */
  lowStockThreshold: number;
  images: string[];
};

export type AdminProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  basePrice: string | null;
  isActive: boolean | null;
  isFeatured: boolean | null;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    price: string;
    costPrice: string | null;
    onHand: number;
    lowStockThreshold?: number | null;
    stockType: string | null;
    images: Array<{ imageUrl: string }>;
  }>;
};

export type ProductFormInitialData = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  variants: ProductFormVariant[];
};

export type ProductFormData = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
};

export interface ProductFormProps {
  initialData?: ProductFormInitialData;
  categories: ProductFormCategory[];
  mode: "create" | "edit";
}
