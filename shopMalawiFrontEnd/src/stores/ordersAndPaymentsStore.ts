// src/stores/ordersAndPaymentsStore.ts
import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getBuyOrders,
  getSellOrders,
  updatePaymentStatus,
  recordRefund,
} from "@/services/orderPaymentService";

export const useOrdersAndPaymentsStore = defineStore(
  "OrdersAndPaymentsStore",
  () => {
    const loading = ref(false);
    const error = ref<Error | null>(null);
    const buyOrders = ref<any[]>([]);
    const sellOrders = ref<any[]>([]);
    const currentUserId = ref<number | null>(null);
    const newOrderIds = ref<number[]>([]);

    const pendingUpdates = ref<
      Array<{ orderType: "buy" | "sell"; paymentId: number; newStatus: string }>
    >([]);

    let syncInterval: ReturnType<typeof setInterval> | null = null;
    let isSyncing = false;
    let pendingSyncRequest = false;

    const setBuyOrders = (ordersFromBackend: any[]) => {
      buyOrders.value = ordersFromBackend.map((orderFromBackend) => {
        const localOrder = buyOrders.value.find(
          (o) => o.payment?.payment_id === orderFromBackend.payment?.payment_id
        );
        if (
          localOrder &&
          (localOrder.dirty || localOrder.payment?.status === "refunding")
        ) {
          return localOrder;
        }
        return { ...orderFromBackend, dirty: false };
      });
    };

    const setSellOrders = (ordersFromBackend: any[]) => {
      sellOrders.value = ordersFromBackend.map((orderFromBackend) => {
        const localOrder = sellOrders.value.find(
          (o) => o.payment?.payment_id === orderFromBackend.payment?.payment_id
        );
        if (
          localOrder &&
          (localOrder.dirty || localOrder.payment?.status === "refunding")
        ) {
          return localOrder;
        }
        return { ...orderFromBackend, dirty: false };
      });
    };

    const updateOrderPaymentStatus = (
      orderType: "buy" | "sell",
      paymentId: number,
      newStatus: string
    ) => {
      const orders = orderType === "buy" ? buyOrders.value : sellOrders.value;
      const order = orders.find((o) => o.payment?.payment_id === paymentId);
      if (order && order.payment) {
        order.payment.status = newStatus;
        order.dirty = true;
        const alreadyPending = pendingUpdates.value.find(
          (u) => u.paymentId === paymentId && u.orderType === orderType
        );
        if (!alreadyPending) {
          pendingUpdates.value.push({ orderType, paymentId, newStatus });
        }
      }
    };

    const fetchOrders = async (userId?: number) => {
      if (userId !== undefined) {
        currentUserId.value = userId;
      }
      if (currentUserId.value === null) return;
      loading.value = true;
      error.value = null;
      try {
        // Capture old order IDs before updating
        const oldBuyOrderIds = new Set(buyOrders.value.map((o) => o.order_id));
        const oldSellOrderIds = new Set(
          sellOrders.value.map((o) => o.order_id)
        );

        const buyResponse = await getBuyOrders(currentUserId.value);
        setBuyOrders(buyResponse.data);
        const sellResponse = await getSellOrders(currentUserId.value);
        setSellOrders(sellResponse.data);

        // Determine new entries
        const newBuyIds = buyResponse.data
          .filter((order: any) => !oldBuyOrderIds.has(order.order_id))
          .map((order: any) => order.order_id);
        const newSellIds = sellResponse.data
          .filter((order: any) => !oldSellOrderIds.has(order.order_id))
          .map((order: any) => order.order_id);

        // Combine and remove duplicates
        newOrderIds.value = Array.from(new Set([...newBuyIds, ...newSellIds]));
      } catch (err: any) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    };

    const sync = async () => {
      if (currentUserId.value === null) return;
      if (isSyncing) {
        pendingSyncRequest = true;
        return;
      }
      isSyncing = true;
      try {
        for (const update of pendingUpdates.value) {
          try {
            loading.value = true;
            error.value = null;
            await updatePaymentStatus(update.paymentId, update.newStatus);
            const orders =
              update.orderType === "buy" ? buyOrders.value : sellOrders.value;
            const order = orders.find(
              (o) => o.payment?.payment_id === update.paymentId
            );
            if (order) {
              order.dirty = false;
            }
          } catch (err: any) {
            error.value = err;
          } finally {
            loading.value = false;
          }
        }
        pendingUpdates.value = [];
        await fetchOrders();
      } finally {
        isSyncing = false;
        if (pendingSyncRequest) {
          pendingSyncRequest = false;
          await sync();
        }
      }
    };

    const startSync = (userId: number, intervalMs = 30000) => {
      if (syncInterval !== null) clearInterval(syncInterval);
      currentUserId.value = userId;
      syncInterval = setInterval(() => {
        sync();
      }, intervalMs);
    };

    const stopSync = () => {
      if (syncInterval !== null) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    };

    const submitRefund = async (
      order_id: number,
      refundScreenshot: File,
      paymentId: number
    ) => {
      try {
        loading.value = true;
        error.value = null;
        await recordRefund({ order_id }, refundScreenshot);
        await updatePaymentStatus(paymentId, "refunding");
      } catch (err: any) {
        error.value = err;
      } finally {
        loading.value = false;
      }
    };

    return {
      loading,
      error,
      buyOrders,
      sellOrders,
      newOrderIds,
      pendingUpdates,
      updateOrderPaymentStatus,
      fetchOrders,
      sync,
      startSync,
      stopSync,
      submitRefund,
    };
  }
);
