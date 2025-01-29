import apiClient from "./apiClient";
import type { Product } from "@/types";

export interface SearchProductsParams {
  query?: string;
  subcategory_id?: number;
  maincategory_id?: number;
  priceRange?: string;
  sortBy?: string;
  uploaded_by?: number;
}

export interface ProductGroup {
  id: number;
  name: string;
  products: Product[];
}

export function searchProducts(params: SearchProductsParams) {
  return apiClient
    .get<ProductGroup[]>("/api/search/searchProducts", { params })
    .then((res) => res.data);
}

export function searchProductsExcludingOffered(
  params: SearchProductsParams & { inquiries_id: number }
) {
  return apiClient
    .get<ProductGroup[]>("/api/search/searchProductsExcludingOffered", {
      params,
    })
    .then((res) => res.data);
}
