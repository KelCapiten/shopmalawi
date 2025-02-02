// src/composables/useBankDetails.ts
import { ref } from "vue";
import {
  getBankDetails,
  addBankDetails,
  updateBankDetails,
  deleteBankDetails,
} from "@/services/bankDetailsService";
import type { BankDetails } from "@/types";

export interface AddBankDetailsPayload {
  user_id: number;
  payment_method_id: number;
  account_number: string;
  account_holder_name: string;
  branch_code?: string;
}

export interface UpdateBankDetailsPayload {
  user_id: number;
  payment_method_id: number;
  account_number: string;
  account_holder_name: string;
  branch_code?: string;
}

export default function useBankDetails() {
  const bankDetails = ref<BankDetails[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchBankDetails = async (
    userId?: number,
    payment_method_id?: number | string
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await getBankDetails(userId, payment_method_id);
      bankDetails.value = data;
    } catch (err: any) {
      error.value = err.message || "Error fetching bank details";
    } finally {
      loading.value = false;
    }
  };

  const createBankDetails = async (payload: AddBankDetailsPayload) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await addBankDetails(payload);
      // Optionally, you can push the new record or re-fetch the list.
      bankDetails.value.push({
        ...payload,
        id: data.id,
        payment_method_name: "", // This can be set if needed
        created_at: "",
        updated_at: "",
      } as BankDetails);
      return data;
    } catch (err: any) {
      error.value = err.message || "Error adding bank details";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const modifyBankDetails = async (
    id: number,
    payload: UpdateBankDetailsPayload
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await updateBankDetails(id, payload);
      bankDetails.value = bankDetails.value.map((bd) =>
        bd.id === id ? { ...bd, ...payload } : bd
      );
      return data;
    } catch (err: any) {
      error.value = err.message || "Error updating bank details";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const removeBankDetails = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await deleteBankDetails(id);
      bankDetails.value = bankDetails.value.filter((bd) => bd.id !== id);
      return data;
    } catch (err: any) {
      error.value = err.message || "Error deleting bank details";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    bankDetails,
    loading,
    error,
    fetchBankDetails,
    createBankDetails,
    modifyBankDetails,
    removeBankDetails,
  };
}
