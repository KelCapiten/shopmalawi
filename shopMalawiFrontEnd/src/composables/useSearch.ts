//\src\composables\useSearch.ts
import { ref } from "vue";
import {
  searchProducts,
  searchProductsExcludingOffered,
} from "@/services/searchService";
import type { Product } from "@/types/types";

export function useSearch() {
  const results = ref<ProductGroup[]>([]);
  const loading = ref(false);
  const error = ref<unknown>(null);

  // Define the parameter types
  interface SearchParams {
    query?: string;
    subcategory_id?: number;
    maincategory_id?: number;
    priceRange?: string;
    sortBy?: string;
    uploaded_by?: number;
  }

  interface SearchExcludingOfferedParams extends SearchParams {
    inquiries_id: number;
  }

  interface ProductGroup {
    id: number;
    name: string;
    products: Product[];
  }

  const searchForProducts = async (params: SearchParams) => {
    loading.value = true;
    error.value = null;
    try {
      results.value = await searchProducts(params);
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const searchForProductsExcludingOffered = async (
    params: SearchExcludingOfferedParams
  ) => {
    loading.value = true;
    error.value = null;
    try {
      results.value = await searchProductsExcludingOffered(params);
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  return {
    results,
    loading,
    error,
    searchForProducts,
    searchForProductsExcludingOffered,
  };
}
