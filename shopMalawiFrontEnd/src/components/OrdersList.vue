//\src\components\OrdersList.vue
<template>
  <div>
    <div v-if="orders.length || sellOrders.length" class="settings-header">
      <h3>Manage Your Orders</h3>
    </div>
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
    <div class="orders-content">
      <OrdersDisplay
        v-if="selectedTab === 'buy'"
        :orders="orders"
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
        :orders="sellOrders"
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
import { defineComponent, onMounted, ref } from "vue";
import OrdersDisplay from "@/components/ordersDisplay.vue";
import useOrderPayment from "@/composables/useOrderPayment";

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
    const {
      loading,
      error,
      orders,
      sellOrders,
      fetchBuyOrders,
      fetchSellOrders,
      updatePaymentStatusHandler,
      recordRefundHandler,
    } = useOrderPayment();
    const selectedTab = ref("buy");

    onMounted(() => {
      fetchBuyOrders(props.userId);
      fetchSellOrders(props.userId);
    });

    const setTab = async (tab: string) => {
      selectedTab.value = tab;
      if (tab === "sell") {
        await fetchSellOrders(props.userId);
      } else {
        fetchBuyOrders(props.userId);
      }
    };

    const handleOrderItemClick = (payload: any) => {
      console.log("Order item clicked:", payload);
    };

    const handleConfirmButtonClicked = async (paymentId: number) => {
      try {
        await updatePaymentStatusHandler(paymentId, "completed");
        await fetchSellOrders(props.userId);
      } catch (err) {
        console.error("Failed to update payment status:", err);
      }
    };

    const handleRefundButtonClicked = async (paymentId: number) => {
      try {
        await updatePaymentStatusHandler(paymentId, "refund");
        await fetchBuyOrders(props.userId);
        await fetchSellOrders(props.userId);
      } catch (err) {
        console.error("Failed to update refund status:", err);
      }
    };

    const handleRefundNotReceivedButtonClicked = async (paymentId: number) => {
      try {
        console.log("click click");
        await updatePaymentStatusHandler(paymentId, "refund");
        await fetchBuyOrders(props.userId);
      } catch (err) {
        console.error("Failed to update refund status:", err);
      }
    };

    const handleReactivateOrderClicked = async (paymentId: number) => {
      try {
        await updatePaymentStatusHandler(paymentId, "pending");
        await fetchSellOrders(props.userId);
        await fetchBuyOrders(props.userId);
      } catch (err) {
        console.error("Failed to update refund status:", err);
      }
    };

    const handleCancelOrderClicked = async (paymentId: number) => {
      try {
        await updatePaymentStatusHandler(paymentId, "canceled");
        await fetchBuyOrders(props.userId);
      } catch (err) {
        console.error("Failed to update refund status:", err);
      }
    };

    const handleConfirmRefundClicked = async (paymentId: number) => {
      try {
        await updatePaymentStatusHandler(paymentId, "refunded");
        await fetchBuyOrders(props.userId);
      } catch (err) {
        console.error("Failed to update refund status:", err);
      }
    };

    const handleRefundUpload = async (
      files: File[],
      order_id: number,
      paymentId: number
    ) => {
      try {
        if (!files.length) return;
        await updatePaymentStatusHandler(paymentId, "refunding");
        await recordRefundHandler({ order_id }, files[0]);
        await fetchSellOrders(props.userId);
      } catch (err) {
        console.error("Failed to record refund:", err);
      }
    };

    return {
      loading,
      error,
      orders,
      sellOrders,
      selectedTab,
      handleConfirmRefundClicked,
      handleRefundNotReceivedButtonClicked,
      handleRefundUpload,
      handleCancelOrderClicked,
      handleReactivateOrderClicked,
      setTab,
      handleOrderItemClick,
      handleConfirmButtonClicked,
      handleRefundButtonClicked,
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
  margin-bottom: 1rem;
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
</style>
