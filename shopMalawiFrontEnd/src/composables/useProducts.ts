// src/composables/useProducts.ts
import { ref } from "vue";
import type { Product } from "@/types";
import {
  addProduct as serviceAddProduct,
  getAllProducts as serviceGetAllProducts,
  deactivateProduct as serviceDeactivateProduct,
  activateProduct as serviceActivateProduct,
  editProduct as serviceEditProduct,
} from "@/services/productService";

export function useProducts() {
  const products = ref<Product[] | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchProducts(filters?: {
    category_id?: number;
    startDate?: string;
    endDate?: string;
    groupBy?: string;
    uploaded_by?: number;
    includeInactive?: boolean;
    store_id?: number;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const data = await serviceGetAllProducts(filters);
      products.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch products";
    } finally {
      loading.value = false;
    }
  }

  async function addNewProduct(payload: {
    name: string;
    description: string;
    price: number;
    category_id: number;
    stockQuantity: number;
    images: File[];
  }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await serviceAddProduct(payload);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to add product";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function editProduct(payload: {
    id: number;
    name: string;
    description: string;
    price: number;
    category_id: number;
    stockQuantity: number;
    images?: File[];
  }) {
    loading.value = true;
    error.value = null;
    try {
      const response = await serviceEditProduct(payload);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to edit product";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deactivateProduct(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await serviceDeactivateProduct(id);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to deactivate product";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function activateProduct(id: number) {
    loading.value = true;
    error.value = null;
    try {
      const response = await serviceActivateProduct(id);
      return response;
    } catch (err: any) {
      error.value = err.message || "Failed to activate product";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    addNewProduct,
    editProduct,
    deactivateProduct,
    activateProduct,
  };
}
