// src/services/productService.ts
import apiClient from "./apiClient";
import type { Product } from "@/types";

interface AddProductPayload {
  name: string;
  description: string;
  price: number;
  category_id: number;
  stockQuantity: number;
  images: File[];
}

interface EditProductPayload {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  stockQuantity: number;
  images?: File[];
}

interface GetProductsFilters {
  category_id?: number;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
  uploaded_by?: number;
  includeInactive?: boolean;
}

interface AddProductResponse {
  message: string;
  productId: number;
}

export async function addProduct(
  payload: AddProductPayload
): Promise<AddProductResponse> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price.toString());
  formData.append("category_id", payload.category_id.toString());
  formData.append("stockQuantity", payload.stockQuantity.toString());
  payload.images.forEach((file) => {
    formData.append("images", file);
  });
  const response = await apiClient.post<AddProductResponse>(
    "/api/products/addProduct",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}

export async function editProduct(
  payload: EditProductPayload
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price.toString());
  formData.append("category_id", payload.category_id.toString());
  formData.append("stockQuantity", payload.stockQuantity.toString());
  if (payload.images && payload.images.length > 0) {
    payload.images.forEach((file) => {
      formData.append("images", file);
    });
  }
  const response = await apiClient.put<{ message: string }>(
    `/api/products/editProduct/${payload.id}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}

export async function getAllProducts(
  filters?: GetProductsFilters
): Promise<Product[] | any> {
  const response = await apiClient.get("/api/products/getAllProducts", {
    params: filters,
  });
  return response.data;
}

export async function deactivateProduct(
  id: number
): Promise<{ message: string }> {
  const response = await apiClient.put(`/api/products/deactivateProduct/${id}`);
  return response.data;
}

export async function activateProduct(
  id: number
): Promise<{ message: string }> {
  const response = await apiClient.put(`/api/products/activateProduct/${id}`);
  return response.data;
}
