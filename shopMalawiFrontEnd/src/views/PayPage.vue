//\src\views\PayPage.vue
<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{
          product ? product.name : "Your Purchase is Ready!"
        }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <productDisplay
        :products="productDisplayData"
        :enableCounter="true"
        :showDescription="false"
        @increment="handleIncrement"
        @decrement="handleDecrement"
      />

      <PaymentMethod ref="paymentMethodRef" />

      <IonCard class="summary-card">
        <IonCardHeader>
          <IonCardSubtitle><strong>Order Summary</strong></IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <IonGrid>
            <IonRow>
              <IonCol size="6">Item</IonCol>
              <IonCol class="ion-text-end">{{
                product?.name || "Product Name"
              }}</IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="6">Cost per Item</IonCol>
              <IonCol class="ion-text-end"
                >MWK {{ costPerItem.toFixed(2) }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6">Quantity</IonCol>
              <IonCol class="ion-text-end"
                >x{{ product?.orderCount || 1 }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6"><strong>Subtotal</strong></IonCol>
              <IonCol class="ion-text-end"
                >MWK {{ subtotal.toFixed(2) }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6"><strong>Total</strong></IonCol>
              <IonCol class="ion-text-end"
                ><strong>MWK {{ total.toFixed(2) }}</strong></IonCol
              >
            </IonRow>
          </IonGrid>
        </IonCardContent>
      </IonCard>
    </IonContent>

    <BuySegment
      :showIcons="false"
      leftButtonText="Cancel"
      rightButtonText="Pay"
      disclaimerText="Upon clicking 'Pay', I confirm I have read and acknowledged <a href='#' class='terms-link'>all terms and policies</a>."
      @left-button-click="onCancelOrder"
      @right-button-click="onPlaceOrder"
    />

    <!-- Centered Success Popup -->
    <transition name="fade">
      <div v-if="showSuccessPopup" class="success-popup">
        <div class="popup-content">
          <h2>Success!</h2>
          <p>{{ popupMessage }}</p>
        </div>
      </div>
    </transition>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import router from "@/router";
import { loadProductFromSessionStorage } from "@/utils/utilities";
import PaymentMethod from "@/components/PaymentMethod.vue";
import productDisplay from "@/components/productDisplay.vue";
import BuySegment from "@/components/BuySegment.vue";
import { useOrdersStore } from "@/stores/ordersStore";
import useOrderPayment from "@/composables/useOrderPayment";

export default defineComponent({
  name: "PayPage",
  components: {
    PaymentMethod,
    productDisplay,
    BuySegment,
  },
  setup() {
    const ordersStore = useOrdersStore();
    const { submitOrderAndPayment, loading, error, orderResponse } =
      useOrderPayment();
    const product = ref<any>(null);
    const paymentMethodRef = ref<any>(null);
    const showSuccessPopup = ref(false);
    const popupMessage = ref("");

    onMounted(() => {
      const loadedProduct = loadProductFromSessionStorage<any>();
      if (loadedProduct) {
        product.value = loadedProduct;
      } else {
        router.replace({ name: "shop" });
      }
    });

    const productDisplayData = computed(() => {
      return product.value
        ? [{ subcategory_name: "Selected Product", products: [product.value] }]
        : [];
    });

    const costPerItem = computed(() =>
      product.value ? parseFloat(product.value.price) : 0
    );
    const subtotal = computed(
      () => costPerItem.value * (product.value?.orderCount || 1)
    );
    const total = computed(() => subtotal.value);

    const onCancelOrder = () => router.back();

    const onPlaceOrder = async () => {
      if (!paymentMethodRef.value || !paymentMethodRef.value.validate()) {
        return;
      }
      ordersStore.setTotalAmount(total.value);
      ordersStore.setPaymentAmount(total.value);
      ordersStore.setOrderItems([
        {
          product_id: product.value.id,
          quantity: product.value.orderCount || 1,
          price: costPerItem.value,
        },
      ]);
      ordersStore.initUserId();

      const orderData = {
        user_id: ordersStore.payload.user_id,
        shipping_address: ordersStore.payload.shipping_address,
        shipping_town: ordersStore.payload.shipping_town,
        total_amount: ordersStore.payload.total_amount,
        payment_method_id: ordersStore.payload.payment_method_id,
        payment_amount: ordersStore.payload.payment_amount,
        order_items: ordersStore.payload.order_items,
      };

      await submitOrderAndPayment(
        orderData,
        ordersStore.payload.paymentScreenshot!
      );

      if (orderResponse.value) {
        popupMessage.value = `${orderResponse.value.message}. Order ID: ${orderResponse.value.order_id}.`;
        showSuccessPopup.value = true;
        setTimeout(() => {
          showSuccessPopup.value = false;
          router.push({ name: "Profile", query: { activateOrders: "true" } });
        }, 10000);
      }
    };

    function handleIncrement(item: any) {
      if (product.value && product.value.id === item.id) {
        const currentCount = product.value.orderCount || 1;
        if (currentCount < product.value.stock_quantity) {
          product.value.orderCount = currentCount + 1;
        }
      }
    }

    function handleDecrement(item: any) {
      if (product.value && product.value.id === item.id) {
        product.value.orderCount = Math.max(
          (product.value.orderCount || 1) - 1,
          1
        );
      }
    }

    return {
      product,
      productDisplayData,
      costPerItem,
      subtotal,
      total,
      onCancelOrder,
      onPlaceOrder,
      handleIncrement,
      handleDecrement,
      loading,
      error,
      orderResponse,
      paymentMethodRef,
      showSuccessPopup,
      popupMessage,
    };
  },
});
</script>

<style scoped>
.summary-card {
  margin-top: 1.5rem;
}

.success-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.popup-content {
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
