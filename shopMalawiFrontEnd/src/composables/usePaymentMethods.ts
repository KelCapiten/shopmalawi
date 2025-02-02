import { ref } from "vue";
import {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/services/paymentMethodsService";
import type { PaymentMethod } from "@/types";

export default function usePaymentMethods() {
  const paymentMethods = ref<PaymentMethod[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchPaymentMethods = async (userId: number | null = null) => {
    loading.value = true;
    error.value = null;
    try {
      paymentMethods.value = await getPaymentMethods(userId);
    } catch (err: any) {
      error.value = err.message || "Error fetching payment methods";
    } finally {
      loading.value = false;
    }
  };

  const addMethod = async (method: Omit<PaymentMethod, "id">) => {
    loading.value = true;
    error.value = null;
    try {
      const newMethod = await addPaymentMethod(method);
      paymentMethods.value.push(newMethod);
    } catch (err: any) {
      error.value = err.message || "Error adding payment method";
    } finally {
      loading.value = false;
    }
  };

  const updateMethod = async (
    id: number,
    updatedMethod: Partial<PaymentMethod>
  ) => {
    loading.value = true;
    error.value = null;
    try {
      await updatePaymentMethod(id, updatedMethod);
      // Update the local list
      const index = paymentMethods.value.findIndex(
        (method) => method.id === id
      );
      if (index !== -1) {
        paymentMethods.value[index] = {
          ...paymentMethods.value[index],
          ...updatedMethod,
        };
      }
    } catch (err: any) {
      error.value = err.message || "Error updating payment method";
    } finally {
      loading.value = false;
    }
  };

  const removeMethod = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await deletePaymentMethod(id);
      paymentMethods.value = paymentMethods.value.filter(
        (method) => method.id !== id
      );
    } catch (err: any) {
      error.value = err.message || "Error deleting payment method";
    } finally {
      loading.value = false;
    }
  };

  return {
    paymentMethods,
    loading,
    error,
    fetchPaymentMethods,
    addMethod,
    updateMethod,
    removeMethod,
  };
}
