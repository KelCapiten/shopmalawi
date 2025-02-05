//src/composables/useOrderPayment.ts
import { ref } from "vue";
import { createOrderAndPayment } from "@/services/orderPaymentService";

export default function useOrderPayment() {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const orderResponse = ref<any>(null);

  const submitOrderAndPayment = async (
    orderData: {
      user_id: number;
      shipping_address: string;
      shipping_town: string;
      total_amount: number;
      payment_method_id: number;
      payment_amount: number;
      order_items: { product_id: number; quantity: number; price: number }[];
    },
    paymentScreenshot: File
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await createOrderAndPayment(
        orderData,
        paymentScreenshot
      );
      orderResponse.value = response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    orderResponse,
    submitOrderAndPayment,
  };
}
