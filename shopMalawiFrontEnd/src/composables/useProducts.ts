// src/composables/useProducts.ts
import { ref } from "vue";
import { getAllProducts } from "@/services/productService";
import { Subcategory } from "@/types";

export function useProducts() {
  const products = ref<Subcategory[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<Error | null>(null);

  const fetchProducts = async (
    groupBy: string,
    category_id?: number,
    startDate?: string,
    endDate?: string,
    uploaded_by?: number
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const data = await getAllProducts(
        groupBy,
        category_id,
        startDate,
        endDate,
        uploaded_by
      );
      products.value = data;
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
  };
}
