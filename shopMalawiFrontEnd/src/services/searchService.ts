//src\services\searchService.ts
import apiClient from "./apiClient";
import type { Product } from "@/types/types";

export interface SearchProductsParams {
  query?: string;
  subcategory_id?: number;
  maincategory_id?: number;
  location_id?: number;
  priceRange?: string;
  sortBy?: string;
  uploaded_by?: number;
}

export interface ProductGroup {
  id: number;
  name: string;
  products: Product[];
}

export async function searchProducts(params: SearchProductsParams) {
  const res = await apiClient.get<ProductGroup[]>(
    "/api/search/searchProducts",
    { params }
  );
  return res.data;
}

export async function searchProductsExcludingOffered(
  params: SearchProductsParams & { inquiries_id: number }
) {
  const res = await apiClient.get<ProductGroup[]>(
    "/api/search/searchProductsExcludingOffered",
    {
      params,
    }
  );
  return res.data;
}
