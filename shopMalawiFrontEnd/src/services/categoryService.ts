// src/services/categoryService.ts
import apiClient from "./apiClient";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>(
    "/api/categories/getCategories"
  );
  return data;
}

interface AddCategoryPayload {
  name: string;
  description?: string;
  parent_id?: number | null;
}

export async function addCategory(payload: AddCategoryPayload) {
  const { data } = await apiClient.post("/api/categories/addCategory", payload);
  return data;
}

interface UpdateCategoryPayload {
  name: string;
  description?: string;
  parent_id?: number | null;
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload
) {
  const { data } = await apiClient.put(
    `/api/categories/updateCategory/${id}`,
    payload
  );
  return data;
}

export async function deleteCategory(id: number) {
  const { data } = await apiClient.delete(
    `/api/categories/deleteCategory/${id}`
  );
  return data;
}
