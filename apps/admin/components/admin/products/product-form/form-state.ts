import { LOW_STOCK_DEFAULT_THRESHOLD } from "@workspace/shared/constants";
import type { ProductFormVariant } from "@workspace/shared/types/product";

export type Attribute = { name: string; values: string[] };

export type FormState = {
  apiError: string | null;
  apiPending: boolean;
  attributes: Attribute[];
  variants: ProductFormVariant[];
  selectedMediaVariantId: string;
};

export type FormAction =
  | { type: "SET_API_ERROR"; payload: string | null }
  | { type: "SET_API_PENDING"; payload: boolean }
  | { type: "SET_VARIANTS"; payload: ProductFormVariant[] }
  | { type: "SET_ATTRIBUTES"; payload: Attribute[] }
  | { type: "UPDATE_ATTRIBUTE_VALUE"; index: number; valString: string }
  | { type: "SET_SELECTED_MEDIA_VARIANT"; payload: string };

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_API_ERROR":
      return { ...state, apiError: action.payload };
    case "SET_API_PENDING":
      return { ...state, apiPending: action.payload };
    case "SET_VARIANTS":
      return { ...state, variants: action.payload };
    case "SET_ATTRIBUTES":
      return { ...state, attributes: action.payload };
    case "UPDATE_ATTRIBUTE_VALUE": {
      const newAttrs = [...state.attributes];
      newAttrs[action.index] = {
        ...newAttrs[action.index],
        values: action.valString
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      return { ...state, attributes: newAttrs };
    }
    case "SET_SELECTED_MEDIA_VARIANT":
      return { ...state, selectedMediaVariantId: action.payload };
    default:
      return state;
  }
}

export const DEFAULT_VARIANT: ProductFormVariant = {
  id: "default",
  name: "Default Variant",
  sku: "",
  price: 0,
  costPrice: 0,
  onHand: 0,
  lowStockThreshold: LOW_STOCK_DEFAULT_THRESHOLD,
  images: [],
};
