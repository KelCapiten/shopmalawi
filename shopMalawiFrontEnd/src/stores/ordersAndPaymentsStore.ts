// src/stores/ordersAndPaymentsStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  createOrderAndPayment,
  getBuyOrders,
  getSellOrders,
  updatePaymentStatus,
  recordRefund,
} from "@/services/orderPaymentService";

interface PendingUpdate {
  type: "updatePaymentStatus" | "recordRefund";
  paymentId?: number;
  status?: string;
  refundData?: { order_id: number; reason?: string };
  refundScreenshot?: File;
}

export const useOrdersAndPaymentsStore = defineStore(
  "ordersAndPaymentsStore",
  () => {
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const orderResponse = ref<any>(null);
    const buyOrders = ref<any[]>([]);
    const sellOrders = ref<any[]>([]);
    const pendingUpdates = ref<PendingUpdate[]>([]);
    const currentUserId = ref<number | null>(null);
    let syncInterval: ReturnType<typeof setInterval>;

    const setUserId = (id: number) => {
      currentUserId.value = id;
    };

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
      const id = userId || currentUserId.value;
      if (!id) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await getBuyOrders(id);
        buyOrders.value = response.data;
      } catch (err: any) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    };

    const fetchSellOrders = async (userId?: number) => {
      const id = userId || currentUserId.value;
      if (!id) return;
      loading.value = true;
      error.value = null;
      try {
        const response = await getSellOrders(id);
        sellOrders.value = response.data;
      } catch (err: any) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    };

    const updateLocalPaymentStatus = (paymentId: number, status: string) => {
      buyOrders.value = buyOrders.value.map((order) => {
        if (order.payment && order.payment.id === paymentId) {
          return { ...order, payment: { ...order.payment, status } };
        }
        return order;
      });
      sellOrders.value = sellOrders.value.map((order) => {
        if (order.payment && order.payment.id === paymentId) {
          return { ...order, payment: { ...order.payment, status } };
        }
        return order;
      });
    };

    const updatePaymentStatusHandler = async (
      paymentId: number,
      status: string
    ) => {
      updateLocalPaymentStatus(paymentId, status);
      pendingUpdates.value.push({
        type: "updatePaymentStatus",
        paymentId,
        status,
      });
      return Promise.resolve();
    };

    const recordRefundHandler = async (
      refundData: { order_id: number; reason?: string },
      refundScreenshot: File
    ) => {
      pendingUpdates.value.push({
        type: "recordRefund",
        refundData,
        refundScreenshot,
      });
      return Promise.resolve();
    };

    const syncUpdates = async () => {
      const remaining: PendingUpdate[] = [];
      for (const update of pendingUpdates.value) {
        if (update.type === "updatePaymentStatus") {
          try {
            await updatePaymentStatus(update.paymentId!, update.status!);
          } catch (err: any) {
            remaining.push(update);
          }
        } else if (update.type === "recordRefund") {
          try {
            await recordRefund(update.refundData!, update.refundScreenshot!);
          } catch (err: any) {
            remaining.push(update);
          }
        }
      }
      pendingUpdates.value = remaining;
      if (currentUserId.value) {
        await fetchBuyOrders(currentUserId.value);
        await fetchSellOrders(currentUserId.value);
      }
    };

    const startSync = () => {
      syncInterval = setInterval(() => {
        syncUpdates();
      }, 60000);
    };

    const stopSync = () => {
      clearInterval(syncInterval);
    };

    startSync();

    return {
      loading,
      error,
      orderResponse,
      buyOrders,
      sellOrders,
      submitOrderAndPayment,
      fetchBuyOrders,
      fetchSellOrders,
      updatePaymentStatusHandler,
      recordRefundHandler,
      setUserId,
      syncUpdates,
      stopSync,
    };
  }
);
