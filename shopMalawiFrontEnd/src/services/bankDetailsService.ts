import apiClient from "./apiClient";
import type { BankDetails } from "@/types";

export const getBankDetails = async (
  userId?: number,
  payment_method_id?: number | string
) => {
  const params: any = {};
  if (userId) params.user_id = userId;
  if (payment_method_id) params.payment_method_id = payment_method_id;
  const response = await apiClient.get<BankDetails[]>(
    "/api/bank-details/getBankDetails",
    { params }
  );
  return response.data;
};

export const addBankDetails = async (payload: {
  user_id: number;
  payment_method_id: number;
  account_number: string;
  account_holder_name: string;
  branch_code?: string;
}) => {
  const response = await apiClient.post(
    "/api/bank-details/addBankDetails",
    payload
  );
  return response.data;
};

export const updateBankDetails = async (
  id: number,
  payload: {
    user_id: number;
    payment_method_id: number;
    account_number: string;
    account_holder_name: string;
    branch_code?: string;
  }
) => {
  const response = await apiClient.put(
    `/api/bank-details/updateBankDetails/${id}`,
    payload
  );
  return response.data;
};

export const deleteBankDetails = async (id: number) => {
  const response = await apiClient.delete(
    `/api/bank-details/deleteBankDetails/${id}`
  );
  return response.data;
};
