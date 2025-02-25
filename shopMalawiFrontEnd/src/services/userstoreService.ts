// src/services/userstoreService.ts
import apiClient from "./apiClient";
import type { Store } from "@/types";

export async function getStore(query?: {
  id?: number;
  owner_id?: number;
}): Promise<Store[]> {
  const params = new URLSearchParams();
  if (query?.id) params.append("id", String(query.id));
  if (query?.owner_id) params.append("owner_id", String(query.owner_id));

  const { data } = await apiClient.get<Store[]>(
    `/api/userstores/getStore?${params.toString()}`
  );
  return data;
}

export async function addStore(newStore: Store): Promise<Store> {
  const { data } = await apiClient.post<{ store: Store }>(
    "/api/userstores/addStore",
    newStore
  );
  return data.store;
}

export async function updateStore(
  id: number,
  storeData: FormData
): Promise<{ message: string; store: Store }> {
  const { data } = await apiClient.put<{ message: string; store: Store }>(
    `/api/userstores/updateStore/${id}`,
    storeData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deleteStore(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(
    `/api/userstores/deleteStore/${id}`
  );
  return data;
}

export async function addProductToStore(
  store_id: number,
  product_id: number
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/userstores/addProductToStore",
    { store_id, product_id }
  );
  return data;
}

export async function removeProductFromStore(
  store_id: number,
  product_id: number
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    "/api/userstores/removeProductFromStore",
    { store_id, product_id }
  );
  return data;
}
