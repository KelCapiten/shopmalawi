// src/services/userstoreService.ts
import apiClient from "./apiClient";
import type { Store } from "@/types";

// The endpoint returns { store: Store } when querying by id,
// and { stores: Store[] } when querying by owner_id or without filters.
interface GetStoreResponseSingle {
  store: Store;
}

interface GetStoreResponseMultiple {
  stores: Store[];
}

export async function getStore(query?: {
  id?: number;
  owner_id?: number;
}): Promise<Store | Store[]> {
  const params = new URLSearchParams();
  if (query?.id) params.append("id", String(query.id));
  if (query?.owner_id) params.append("owner_id", String(query.owner_id));

  const { data } = await apiClient.get<
    GetStoreResponseSingle | GetStoreResponseMultiple
  >(`/api/userstores/getStore?${params.toString()}`);

  // When an "id" is provided, the endpoint returns { store: Store }
  if ("store" in data) {
    return data.store;
  }
  // Otherwise, it returns { stores: Store[] }
  return data.stores;
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
  updatedStore: Partial<Store>
): Promise<{ message: string }> {
  const { data } = await apiClient.put<{ message: string }>(
    `/api/userstores/updateStore/${id}`,
    updatedStore
  );
  return data;
}
