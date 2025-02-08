//\src\components\ordersDisplay.vue
<template>
  <div>
    <div class="container">
      <div v-if="isLoading" class="status-message">Loading...</div>
      <div v-else-if="error" class="status-message error">
        {{ formattedError }}
      </div>
      <div v-else-if="orders.length === 0" class="status-message empty">
        <h3>{{ emptyMessageText }}</h3>
        <p>{{ emptyMessageSubText }}</p>
      </div>
      <IonList v-else lines="none" class="orders-list">
        <IonCard
          v-for="(order, index) in orders"
          :key="order.order_id || index"
          class="order-card"
        >
          <IonCardHeader class="order-header">
            <div class="order-header-content">
              <div class="order-header-top">
                <div class="order-title">Order #{{ order.order_id }}</div>
                <div class="order-date">
                  {{ formatDateOnly(order.created_at) }}
                </div>
              </div>
              <div
                class="order-header-bottom"
                :class="{
                  refund:
                    order.payment &&
                    (order.payment.status === 'refund' ||
                      order.payment.status === 'refunding' ||
                      order.payment.status === 'refunded'),
                }"
              >
                <div class="order-amount">MWK {{ order.total_amount }}</div>
                <template v-if="orderType === 'buy' && order.payment">
                  <button
                    class="confirm-payment-button"
                    :class="{
                      'pending-buy': order.payment.status === 'pending',
                      confirmed: order.payment.status === 'completed',
                      failed:
                        order.payment.status === 'failed' ||
                        order.payment.status === 'canceled',
                      refund:
                        order.payment.status === 'refund' ||
                        order.payment.status === 'refunding' ||
                        order.payment.status === 'refunded',
                    }"
                    disabled
                  >
                    <template v-if="order.payment.status === 'pending'">
                      <span>Pending Confirmation</span>
                    </template>
                    <template v-else-if="order.payment.status === 'completed'">
                      <span>Payment Confirmed</span>
                      <span class="gold-tick">✔</span>
                    </template>
                    <template v-else-if="order.payment.status === 'failed'">
                      <span>Payment Not Received</span>
                      <span class="red-x">✖</span>
                    </template>
                    <template v-else-if="order.payment.status === 'canceled'">
                      <span>Order Canceled</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refunding'">
                      <span>Refund Sent</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refunded'">
                      <span>Refunded</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refund'">
                      <span>Refund Requested</span>
                    </template>
                    <template v-else>
                      <span>Confirm Payment</span>
                    </template>
                  </button>
                </template>
                <template v-else>
                  <button
                    class="confirm-payment-button"
                    :class="{
                      pending: order.payment.status === 'pending',
                      confirmed: order.payment.status === 'completed',
                      failed:
                        order.payment.status === 'failed' ||
                        order.payment.status === 'canceled',
                      refund:
                        order.payment.status === 'refund' ||
                        order.payment.status === 'refunding' ||
                        order.payment.status === 'refunded',
                      active: order.payment.status === 'pending',
                    }"
                    @click="confirmPayment(order.payment.payment_id)"
                    :disabled="order.payment.status !== 'pending'"
                  >
                    <template v-if="order.payment.status === 'pending'">
                      <span>Confirm Payment</span>
                    </template>
                    <template v-else-if="order.payment.status === 'completed'">
                      <span>Payment Confirmed</span>
                      <span class="gold-tick">✔</span>
                    </template>
                    <template v-else-if="order.payment.status === 'failed'">
                      <span>Payment Not Received</span>
                      <span class="red-x">✖</span>
                    </template>
                    <template v-else-if="order.payment.status === 'canceled'">
                      <span>Order Canceled</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refunding'">
                      <span>Refund Sent</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refunded'">
                      <span>Refunded</span>
                    </template>
                    <template v-else-if="order.payment.status === 'refund'">
                      <span>Refund Requested</span>
                    </template>
                  </button>
                </template>
              </div>
            </div>
          </IonCardHeader>

          <IonCardContent>
            <div
              v-for="(item, iIndex) in order.order_items"
              :key="iIndex"
              class="item-row"
              @click="$emit('orderItemClicked', { order, item })"
            >
              <p v-if="item.name" class="item-name">{{ item.name }}</p>
              <div class="item-info">
                <div
                  v-if="item.images && item.images.length"
                  class="image-wrapper"
                >
                  <img
                    :src="getImageUrl(item.images[0].image_path)"
                    :alt="item.images[0].alt_text || 'Product Image'"
                    class="product-image"
                  />
                </div>
                <div class="amount-qty">
                  <p class="item-price">MWK {{ item.purchase_price }} each</p>
                  <p class="item-qty">Quantity: {{ item.quantity }}</p>
                  <p v-if="item.description" class="item-desc">
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </IonCardContent>

          <IonList class="payment-list">
            <IonItem
              button
              :detail="false"
              @click="togglePaymentDetails(order.order_id)"
              class="payment-toggle"
            >
              <IonLabel>Payments</IonLabel>
              <IonIcon
                :icon="
                  isPaymentExpanded(order.order_id)
                    ? chevronUpOutline
                    : chevronDownOutline
                "
                slot="end"
              />
            </IonItem>
            <div
              v-if="isPaymentExpanded(order.order_id) && order.payment"
              class="payment-details"
            >
              <div class="payment-left">
                <div class="payment-info">
                  <p><strong>Expected Amount</strong></p>
                  <div>MWK {{ order.payment.amount }}</div>
                </div>
                <div
                  v-if="order.payment.payment_screenshot"
                  class="payment-screenshot"
                >
                  <img
                    :src="
                      getImageUrl(order.payment.payment_screenshot.image_path)
                    "
                    :alt="order.payment.payment_screenshot.alt_text"
                    class="payment-image"
                  />
                </div>
              </div>
              <div class="payment-divider"></div>
              <div class="payment-refund">
                <!-- BUY ORDERS -->
                <template v-if="orderType === 'buy'">
                  <!-- Payment Confirmed -->
                  <template v-if="order.payment.status === 'completed'">
                    <p class="refund-message">
                      Payment has been confirmed by seller, kindly follow up on
                      your order
                    </p>
                    <button
                      class="chat-button"
                      @click="chatWithSeller(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Seller</span>
                    </button>
                  </template>

                  <!-- Payment Failed -->
                  <template v-else-if="order.payment.status === 'failed'">
                    <p><strong>Payment</strong></p>
                    <p class="refund-message">
                      The user did not confirm the payment
                    </p>
                    <button
                      class="confirm-payment-button"
                      @click="confirmPayment(order.payment.payment_id)"
                    >
                      Resend Screenshot
                    </button>
                    <button
                      class="refund-button"
                      @click="cancelOrder(order.payment.payment_id)"
                    >
                      Cancel Order
                    </button>
                    <p>or</p>
                    <button
                      class="chat-button"
                      @click="chatWithSeller(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Seller</span>
                    </button>
                  </template>

                  <!-- Payment Canceled -->
                  <template v-else-if="order.payment.status === 'canceled'">
                    <p class="refund-message">
                      The seller has been notified of the refund
                    </p>
                    <button
                      class="reactivate-order-button"
                      @click="reactivateOrder(order.payment.payment_id)"
                    >
                      Reactivate Order
                    </button>
                    <button
                      class="chat-button"
                      @click="chatWithSeller(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Seller</span>
                    </button>
                  </template>

                  <!-- Refunding -->
                  <template v-else-if="order.payment.status === 'refunding'">
                    <p><strong>Refunded</strong></p>
                    <div v-if="order.refund && order.refund.refund_screenshot">
                      <img
                        :src="
                          getImageUrl(order.refund.refund_screenshot.image_path)
                        "
                        :alt="
                          order.refund.refund_screenshot.alt_text ||
                          'Refund Screenshot'
                        "
                        class="refund-image"
                      />
                    </div>
                    <button
                      class="not-received-button"
                      @click="
                        refundPaymentNotReceived(order.payment.payment_id)
                      "
                    >
                      Not Received
                    </button>
                    <button
                      class="confirm-refund-button"
                      @click="confirmRefund(order.payment.payment_id)"
                    >
                      Confirm Refund
                    </button>
                  </template>

                  <!-- Refunded -->
                  <template v-else-if="order.payment.status === 'refunded'">
                    <p><strong>Refund</strong></p>
                    <div v-if="order.refund && order.refund.refund_screenshot">
                      <img
                        :src="
                          getImageUrl(order.refund.refund_screenshot.image_path)
                        "
                        :alt="
                          order.refund.refund_screenshot.alt_text ||
                          'Refund Screenshot'
                        "
                        class="refund-image"
                      />
                    </div>
                  </template>

                  <!-- Refund Requested (UPDATED SECTION) -->
                  <template v-else-if="order.payment.status === 'refund'">
                    <p><strong>Refund</strong></p>
                    <p class="refund-message">
                      Seller is refunding this payment. Waiting for screenshot.
                    </p>
                    <button
                      class="chat-button"
                      @click="chatWithSeller(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Seller</span>
                    </button>
                  </template>

                  <!-- Default (no specific matching status) -->
                  <template v-else>
                    <p><strong>Refund</strong></p>
                    <p class="refund-message">
                      Would you like to cancel the order and request a refund?
                    </p>
                    <button
                      class="refund-button"
                      @click="cancelOrder(order.payment.payment_id)"
                    >
                      Cancel Order
                    </button>
                    <button
                      class="chat-button"
                      @click="chatWithSeller(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Seller</span>
                    </button>
                  </template>
                </template>

                <!-- SELL ORDERS -->
                <template v-else>
                  <template v-if="order.payment.status === 'pending'">
                    <p><strong>Confirm Payment</strong></p>
                    <p class="refund-message">
                      Please confirm. Didn't receive this payment? Contact the
                      buyer.
                    </p>
                    <button
                      class="chat-button"
                      @click="chatWithBuyer(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Buyer</span>
                    </button>
                  </template>
                  <template v-else-if="order.payment.status === 'failed'">
                    <p><strong>Confirm Payment</strong></p>
                    <p class="refund-message">
                      You took too long to confirm. Did you receive this
                      payment?
                    </p>
                    <button
                      class="confirm-payment-button"
                      @click="confirmPayment(order.payment.payment_id)"
                    >
                      Confirm Payment
                    </button>
                    <p>or</p>
                    <button
                      class="chat-button"
                      @click="chatWithBuyer(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Buyer</span>
                    </button>
                  </template>
                  <template v-else-if="order.payment.status === 'canceled'">
                    <p><strong>Order Canceled</strong></p>
                    <p class="refund-message">Kindly refund the seller</p>
                    <button
                      class="refund-button"
                      @click="refundPayment(order.payment.payment_id)"
                    >
                      Refund Payment
                    </button>
                  </template>
                  <template v-else-if="order.payment.status === 'refunding'">
                    <p><strong>Refunded</strong></p>
                    <div v-if="order.refund && order.refund.refund_screenshot">
                      <img
                        :src="
                          getImageUrl(order.refund.refund_screenshot.image_path)
                        "
                        :alt="
                          order.refund.refund_screenshot.alt_text ||
                          'Refund Screenshot'
                        "
                        class="refund-image"
                      />
                    </div>
                  </template>
                  <template v-else-if="order.payment.status === 'refunded'">
                    <p><strong>Refund</strong></p>
                    <div v-if="order.refund && order.refund.refund_screenshot">
                      <img
                        :src="
                          getImageUrl(order.refund.refund_screenshot.image_path)
                        "
                        :alt="
                          order.refund.refund_screenshot.alt_text ||
                          'Refund Screenshot'
                        "
                        class="refund-image"
                      />
                    </div>
                  </template>
                  <template v-else-if="order.payment.status === 'refund'">
                    <ImageUploader
                      class="ImageUploader"
                      label="Refund Screenshot"
                      placeholderMessage="Click to upload"
                      @uploaded-images="
                        (files) =>
                          screenshotUploaded(
                            files,
                            order.order_id,
                            order.payment.payment_id
                          )
                      "
                    />
                    <button
                      class="chat-button"
                      @click="chatWithBuyer(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Buyer</span>
                    </button>
                  </template>
                  <template v-else-if="order.payment.status === 'completed'">
                    <p><strong>Refund</strong></p>
                    <p class="refund-message">
                      Would you like to refund this payment?
                    </p>
                    <button
                      class="refund-button"
                      @click="refundPayment(order.payment.payment_id)"
                    >
                      Refund Payment
                    </button>
                    <button
                      class="cancel-confirmation-button"
                      @click="reactivateOrder(order.payment.payment_id)"
                    >
                      undo confirmation
                    </button>
                    <button
                      class="chat-button"
                      @click="chatWithBuyer(order.payment.payment_id)"
                    >
                      <ion-icon :icon="chatIcon" />
                      <span>Message Buyer</span>
                    </button>
                  </template>
                </template>
              </div>
            </div>
          </IonList>
        </IonCard>
      </IonList>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from "vue";
import {
  chevronUpOutline,
  chevronDownOutline,
  chatbubblesOutline,
} from "ionicons/icons";
import { getImageUrl } from "@/utils/utilities";
import ImageUploader from "@/components/ImageUploader.vue";

function formatDateOnly(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default defineComponent({
  name: "OrdersDisplay",
  components: { ImageUploader },
  props: {
    orders: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    error: {
      type: [Object, String] as PropType<Error | string | null>,
      default: null,
    },
    emptyMessageText: {
      type: String,
      default: "No orders found",
    },
    emptyMessageSubText: {
      type: String,
      default: "There are currently no orders available.",
    },
    orderType: {
      type: String,
      default: "buy",
    },
  },
  emits: [
    "orderItemClicked",
    "confirmButtonClicked",
    "refundButtonClicked",
    "chatButtonClicked",
    "cancelOrderClicked",
    "cancelRefundClicked",
    "reactivateOrderClicked",
    "cancelConfirmationClicked",
    "screenshotUploaded",
    "confirmRefundClicked",
    "refundNotReceivedButtonClicked",
  ],
  setup(props, { emit }) {
    const expandedPayments = ref<Record<number, boolean>>({});

    const togglePaymentDetails = (orderId: number) => {
      expandedPayments.value[orderId] = !expandedPayments.value[orderId];
    };

    const isPaymentExpanded = (orderId: number) => {
      return !!expandedPayments.value[orderId];
    };

    const confirmPayment = (paymentId: number) => {
      emit("confirmButtonClicked", paymentId);
    };

    const refundPayment = (paymentId: number) => {
      emit("refundButtonClicked", paymentId);
    };

    const refundPaymentNotReceived = (paymentId: number) => {
      emit("refundNotReceivedButtonClicked", paymentId);
    };

    const cancelOrder = (paymentId: number) => {
      emit("cancelOrderClicked", paymentId);
    };

    const chatWithSeller = (paymentId: number) => {
      emit("chatButtonClicked", paymentId);
    };

    const chatWithBuyer = (paymentId: number) => {
      emit("chatButtonClicked", paymentId);
    };

    const reactivateOrder = (paymentId: number) => {
      emit("reactivateOrderClicked", paymentId);
    };

    const confirmRefund = (paymentId: number) => {
      emit("confirmRefundClicked", paymentId);
    };

    const screenshotUploaded = (
      files: File[],
      orderId: number,
      paymentId: number
    ) => {
      emit("screenshotUploaded", files, orderId, paymentId);
    };

    const formattedError = computed(() => {
      if (typeof props.error === "string") return props.error;
      return props.error?.message || "";
    });

    return {
      expandedPayments,
      refundPaymentNotReceived,
      screenshotUploaded,
      togglePaymentDetails,
      isPaymentExpanded,
      confirmPayment,
      refundPayment,
      cancelOrder,
      chatWithSeller,
      chatWithBuyer,
      reactivateOrder,
      confirmRefund,
      formattedError,
      chevronUpOutline,
      chevronDownOutline,
      chatIcon: chatbubblesOutline,
      getImageUrl,
      formatDateOnly,
    };
  },
});
</script>

<style scoped>
.container {
  background: #fafafa;
  padding: 1.5rem;
  min-height: 100vh;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-size: 0.9rem;
}
.status-message {
  text-align: center;
  font-size: 1rem;
  color: #555;
  margin: 2rem 0;
}
.status-message.error {
  color: #c0392b;
  font-weight: bold;
}
.status-message.empty h3 {
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
}
.orders-list {
  padding: 0;
}
.order-card {
  margin: 1.5rem auto;
  max-width: 680px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #2c2c2c;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
}
.order-header {
  background: #34495e;
  padding: 1rem 1.2rem;
  color: #ecf0f1;
}
.order-header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.order-header-top,
.order-header-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-title {
  font-size: 1.1rem;
  font-weight: 600;
}
.order-date {
  font-size: 0.85rem;
  opacity: 0.85;
}
.order-amount {
  font-size: 1rem;
  font-weight: 500;
}
.confirm-payment-button {
  background: #007aff;
  color: #fff;
  border: 2px solid white;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: background 0.3s, border 0.3s;
}
.confirm-payment-button.pending-buy {
  background: #ccc;
  color: #666;
  border: 1px solid #ccc;
  cursor: default;
}
.confirm-payment-button.confirmed {
  background: white;
  border: 1px solid gold;
  font-weight: bold;
  color: #666;
  cursor: default;
}
.confirm-payment-button.failed {
  background: #fff;
  color: red;
  border: 1px solid red;
  cursor: default;
}
.confirm-payment-button.refund {
  background: rgb(233, 255, 233);
  color: #3d3d3d;
  font-weight: bold;
  border: 1px solid #06a00b;
  cursor: default;
}
.gold-tick,
.red-x {
  font-size: 0.9rem;
}
.gold-tick {
  color: orange;
}
.red-x {
  color: red;
}
.item-row {
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.3s;
}
.item-row:last-child {
  border-bottom: none;
}
.item-row:hover {
  background: #f7f7f7;
}
.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
  color: #333;
}
.item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.image-wrapper {
  flex: 0 0 auto;
}
.product-image {
  width: 70px;
  height: 70px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.amount-qty {
  display: flex;
  flex-direction: column;
}
.item-price,
.item-qty {
  font-size: 0.85rem;
  color: #666;
  font-weight: bold;
  margin: 0;
}
.item-desc {
  margin: 0.3rem 0;
  font-size: 0.85rem;
  font-weight: bold;
  color: #383838;
  height: 20px;
  overflow: hidden;
}
.payment-list {
  border-top: 1px solid #f0f0f0;
}
.payment-toggle {
  --inner-padding-top: 0.1rem;
  --inner-padding-bottom: 0.1rem;
  font-weight: bold;
  color: #2b2b2b;
  border-top: 1px solid #a1a1a1;
}
.payment-details {
  display: flex;
  gap: 1rem;
  padding: 0 1rem 1rem;
  border-top: 1px solid #eaeaea;
  font-size: 0.85rem;
  color: #444;
}
.payment-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.payment-info p {
  margin: 0;
}
.payment-screenshot {
  text-align: center;
}
.payment-image {
  max-width: 130px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.payment-divider {
  width: 1px;
  background: #ddd;
  margin: 0 1rem;
}
.payment-refund {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.payment-refund p {
  margin: 0;
  font-weight: bold;
}
.refund-message {
  font-size: 0.8rem;
  color: #666;
}
.refund-button,
.chat-button,
.confirm-refund-button {
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;
}
.refund-button {
  background: #e0a800;
  color: #fff;
}
.refund-button:hover {
  background: #c69500;
}
.confirm-refund-button {
  background: #28a745;
  color: #fff;
}
.confirm-refund-button:hover {
  background: #218838;
}
.chat-button {
  background: #007aff;
  color: #fff;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.chat-button:hover {
  background: greenyellow;
}
.reactivate-order-button {
  background: #28a745;
  color: #fff;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;
  margin-bottom: 0.5rem;
}
.reactivate-order-button:hover {
  background: #218838;
}
.cancel-confirmation-button {
  background: #dc3545;
  color: #fff;
  border: none;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 0.5rem;
}
.cancel-confirmation-button:hover {
  background: #c82333;
}
.refund-image {
  max-width: 150px;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
</style>
