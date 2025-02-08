// src/composables/useOrderPayment.ts
import { ref } from "vue";
import {
  createOrderAndPayment,
  getBuyOrders,
  getSellOrders,
  updatePaymentStatus,
  recordRefund,
} from "@/services/orderPaymentService";

export default function useOrderPayment() {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const orderResponse = ref<any>(null);
  const orders = ref<any[]>([]);
  const sellOrders = ref<any[]>([]);

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

  const fetchBuyOrders = async (userId?: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getBuyOrders(userId);
      orders.value = response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const fetchSellOrders = async (userId?: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await getSellOrders(userId);
      sellOrders.value = response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const updatePaymentStatusHandler = async (
    paymentId: number,
    status: string
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await updatePaymentStatus(paymentId, status);
      return response.data;
    } catch (err: any) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const recordRefundHandler = async (
    refundData: { order_id: number; reason?: string },
    refundScreenshot: File
  ) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await recordRefund(refundData, refundScreenshot);
      return response.data;
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
    orders,
    fetchBuyOrders,
    sellOrders,
    fetchSellOrders,
    updatePaymentStatusHandler,
    recordRefundHandler,
  };
}
