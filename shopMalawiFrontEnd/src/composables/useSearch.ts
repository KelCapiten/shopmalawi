import { ref } from "vue";
import {
  searchProducts,
  searchProductsExcludingOffered,
  type SearchProductsParams,
  type ProductGroup,
} from "@/services/searchService";

export function useSearch() {
  const results = ref<ProductGroup[]>([]);
  const loading = ref(false);
  const error = ref<unknown>(null);

  const performSearch = async (params: SearchProductsParams) => {
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

  const performSearchExcludingOffered = async (
    params: SearchProductsParams & { inquiries_id: number }
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
    performSearch,
    performSearchExcludingOffered,
  };
}
