import { axios } from "@workspace/shared/api-client";
import { API_ENDPOINTS } from "@workspace/shared/api-endpoints";

export type OpeningStockRow = {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  categoryName: string | null;
  currentOnHand: number;
  currentCostPrice: number;
  openingQuantity: number | null;
  openingUnitCost: number | null;
  openingValue: number | null;
  effectiveDate: string | null;
  note: string | null;
  status: string | null;
};

export type OpeningStockListResponse = {
  data: OpeningStockRow[];
  summary: {
    totalVariants: number;
    enteredVariants: number;
    totalQuantity: number;
    totalValue: number;
  };
  metadata: { page: number; limit: number; total: number };
};

export type OpeningStockCsvRow = {
  rowNumber: number;
  sku: string;
  openingQuantity: number;
  openingUnitCost: number;
  note: string | null;
  variantId?: string;
  productName?: string;
  variantName?: string;
  errors: string[];
};

export type OpeningStockPreviewResponse = {
  validRows: OpeningStockCsvRow[];
  errorRows: OpeningStockCsvRow[];
  summary: { totalRows: number; totalQuantity: number; totalValue: number };
};

export const openingStockClient = {
  list(params: { search?: string; page?: number; limit?: number }) {
    return axios.get<OpeningStockListResponse>(API_ENDPOINTS.ADMIN.INVENTORY.OPENING_STOCK_LIST, {
      params,
    }) as unknown as Promise<OpeningStockListResponse>;
  },

  apply(
    entries: Array<{
      variantId: string;
      quantity: number;
      unitCost: number;
      effectiveDate: string;
      note?: string | null;
    }>,
  ) {
    return axios.patch<{ success: boolean; results: unknown[] }>(
      API_ENDPOINTS.ADMIN.INVENTORY.OPENING_STOCK_BULK,
      { entries },
    ) as unknown as Promise<{ success: boolean; results: unknown[] }>;
  },

  previewCsv(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return axios.post<OpeningStockPreviewResponse>(
      API_ENDPOINTS.ADMIN.INVENTORY.OPENING_STOCK_PREVIEW,
      formData,
    ) as unknown as Promise<OpeningStockPreviewResponse>;
  },
};
