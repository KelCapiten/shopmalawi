//\src\components\OrdersList.vue
<template>
  <div>
    <div v-if="buyOrders.length || sellOrders.length" class="settings-header">
      <h3>Manage Your Orders</h3>
    </div>

    <!-- Tab Selector -->
    <div class="tab-selector">
      <button
        :class="{ 'tab-button': true, active: selectedTab === 'buy' }"
        @click="setTab('buy')"
      >
        Your Buy Orders
      </button>
      <button
        :class="{ 'tab-button': true, active: selectedTab === 'sell' }"
        @click="setTab('sell')"
      >
        Your Sell Orders
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="filter-bar">
      <button
        v-for="filter in filters"
        :key="filter.value"
        :class="{
          'filter-button': true,
          active: selectedFilter === filter.value,
        }"
        @click="setFilter(filter.value)"
      >
        <ion-icon :icon="filter.icon" class="filter-icon"></ion-icon>
        <span>{{ filter.label }}</span>
      </button>
    </div>

    <!-- Orders Display -->
    <div class="orders-content">
      <OrdersDisplay
        v-if="selectedTab === 'buy'"
        :orders="filteredBuyOrders"
        :isLoading="loading"
        :error="error"
        emptyMessageText="No buy orders found"
        emptyMessageSubText="There are currently no orders available."
        orderType="buy"
        @orderItemClicked="handleOrderItemClick"
        @cancelOrderClicked="handleCancelOrderClicked"
        @reactivateOrderClicked="handleReactivateOrderClicked"
        @refundNotReceivedButtonClicked="handleRefundNotReceivedButtonClicked"
        @confirmRefundClicked="handleConfirmRefundClicked"
      />
      <OrdersDisplay
        v-if="selectedTab === 'sell'"
        :orders="filteredSellOrders"
        :isLoading="loading"
        :error="error"
        emptyMessageText="No sell orders found"
        emptyMessageSubText="There are currently no orders available."
        orderType="sell"
        @orderItemClicked="handleOrderItemClick"
        @confirmButtonClicked="handleConfirmButtonClicked"
        @refundButtonClicked="handleRefundButtonClicked"
        @reactivateOrderClicked="handleReactivateOrderClicked"
        @screenshotUploaded="handleRefundUpload"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, computed } from "vue";
import OrdersDisplay from "@/components/ordersDisplay.vue";
import { useOrdersAndPaymentsStore } from "@/stores/ordersAndPaymentsStore";
import {
  appsOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  returnDownBackOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "OrdersList",
  components: { OrdersDisplay },
  props: {
    userId: {
      type: Number,
      default: 0,
    },
  },
  setup(props) {
    const store = useOrdersAndPaymentsStore();
    const selectedTab = ref("buy");
    const selectedFilter = ref("all");

    const filters = [
      { label: "All", value: "all", icon: appsOutline },
      { label: "Pending", value: "pending", icon: timeOutline },
      { label: "Completed", value: "completed", icon: checkmarkCircleOutline },
      { label: "Failed", value: "failed", icon: closeCircleOutline },
      { label: "Refund", value: "refund", icon: returnDownBackOutline },
    ];

    onMounted(() => {
      store.fetchOrders(props.userId);
      store.startSync(props.userId);
    });

    const setTab = (tab: string) => {
      selectedTab.value = tab;
    };

    const setFilter = (filter: string) => {
      selectedFilter.value = filter;
    };

    const filteredBuyOrders = computed(() => {
      if (selectedFilter.value === "all") return store.buyOrders;
      return store.buyOrders.filter((order: any) => {
        const status = order.payment?.status;
        if (!status) return false;
        if (selectedFilter.value === "pending") return status === "pending";
        if (selectedFilter.value === "completed") return status === "completed";
        if (selectedFilter.value === "failed")
          return status === "failed" || status === "canceled";
        if (selectedFilter.value === "refund")
          return ["refund", "refunding", "refunded"].includes(status);
        return true;
      });
    });

    const filteredSellOrders = computed(() => {
      if (selectedFilter.value === "all") return store.sellOrders;
      return store.sellOrders.filter((order: any) => {
        const status = order.payment?.status;
        if (!status) return false;
        if (selectedFilter.value === "pending") return status === "pending";
        if (selectedFilter.value === "completed") return status === "completed";
        if (selectedFilter.value === "failed")
          return status === "failed" || status === "canceled";
        if (selectedFilter.value === "refund")
          return ["refund", "refunding", "refunded"].includes(status);
        return true;
      });
    });

    const handleOrderItemClick = (payload: any) => {
      console.log("Order item clicked:", payload);
    };

    const handleConfirmButtonClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "completed");
      store.updateOrderPaymentStatus("buy", paymentId, "completed");
    };

    const handleRefundButtonClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "refund");
      store.updateOrderPaymentStatus("buy", paymentId, "refund");
    };

    const handleRefundNotReceivedButtonClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "refund");
      store.updateOrderPaymentStatus("buy", paymentId, "refund");
    };

    const handleReactivateOrderClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "pending");
      store.updateOrderPaymentStatus("buy", paymentId, "pending");
    };

    const handleCancelOrderClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "canceled");
      store.updateOrderPaymentStatus("buy", paymentId, "canceled");
    };

    const handleConfirmRefundClicked = (paymentId: number) => {
      store.updateOrderPaymentStatus("sell", paymentId, "refunded");
      store.updateOrderPaymentStatus("buy", paymentId, "refunded");
    };

    const handleRefundUpload = async (
      files: File[],
      order_id: number,
      paymentId: number
    ) => {
      if (!files.length) return;
      const refundScreenshot = files[0];
      await store.submitRefund(order_id, refundScreenshot, paymentId);
      store.startSync(props.userId, 5);
    };

    return {
      loading: store.loading,
      error: store.error,
      buyOrders: store.buyOrders,
      sellOrders: store.sellOrders,
      selectedTab,
      selectedFilter,
      filters,
      filteredBuyOrders,
      filteredSellOrders,
      setTab,
      setFilter,
      handleOrderItemClick,
      handleConfirmButtonClicked,
      handleRefundButtonClicked,
      handleRefundNotReceivedButtonClicked,
      handleReactivateOrderClicked,
      handleCancelOrderClicked,
      handleConfirmRefundClicked,
      handleRefundUpload,
    };
  },
});
</script>

<style scoped>
.settings-header {
  display: flex;
  align-items: center;
  background: #f2f2f2;
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  user-select: none;
  margin-bottom: 0.5rem;
}
.settings-header h3 {
  margin: 0;
  font-size: 1rem;
}
.tab-selector {
  display: flex;
  width: 100%;
}
.tab-button {
  flex: 1;
  background: #e0e0e0;
  border: none;
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
  outline: none;
}
.tab-button:not(:last-child) {
  border-right: 1px solid #ccc;
}
.tab-button.active {
  background: #007aff;
  color: #fff;
}
.filter-bar {
  display: flex;
  gap: 0.5rem;
  justify-content: space-evenly;
  background: #f7f7f7;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 1rem 0;
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filter-bar::-webkit-scrollbar {
  display: none;
}
.filter-button {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  transition: background 0.3s, color 0.3s;
  outline: none;
}
.filter-button.active {
  background: #007aff;
  color: #fff;
  border-radius: 4px;
}
.filter-icon {
  font-size: 1.1rem;
}
.orders-content {
  margin-top: 1rem;
}
</style>
