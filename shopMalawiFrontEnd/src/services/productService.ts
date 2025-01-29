// src/services/productService.ts
import apiClient from "./apiClient";
import { Subcategory } from "@/types";

export const getAllProducts = async (
  groupBy: string,
  category_id?: number,
  startDate?: string,
  endDate?: string,
  uploaded_by?: number
): Promise<Subcategory[]> => {
  try {
    const params: any = { groupBy };

    if (category_id) params.category_id = category_id;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (uploaded_by) params.uploaded_by = uploaded_by;

    const response = await apiClient.get<Subcategory[]>(
      "/api/products/getAllProducts",
      {
        params,
      }
    );

    return response.data;
  } catch (error: any) {
    // Optionally, you can handle specific error statuses here
    throw error.response?.data || error;
  }
};
