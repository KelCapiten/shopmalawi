import apiClient from "./apiClient";
import type {
  Product,
  AddProductResponse,
  AddProductPayload,
  EditProductPayload,
  GetProductsFilters,
} from "@/types/types";

// Remove interface definitions since they're now in types.ts

export async function addProduct(
  payload: AddProductPayload
): Promise<AddProductResponse> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price.toString());
  formData.append("category_id", payload.category_id.toString());
  formData.append("location_id", payload.location_id.toString()); // Add location_id
  formData.append("stockQuantity", payload.stockQuantity.toString());

  payload.images.forEach((image: File) => {
    formData.append("images", image);
  });

  const response = await apiClient.post("/api/products/addProduct", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data as AddProductResponse;
}

export async function editProduct(
  payload: EditProductPayload
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price.toString());
  formData.append("category_id", payload.category_id.toString());
  formData.append("location_id", payload.location_id.toString()); // Add location_id
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
