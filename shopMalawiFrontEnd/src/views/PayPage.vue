//src/views/PayPage.vue
<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{
          purchase.product ? purchase.product.name : "Your Purchase is Ready!"
        }}</IonTitle>
      </IonToolbar>
    </IonHeader>

    <IonContent>
      <productDisplay
        :products="purchase.productDisplayData"
        :enableCounter="true"
        :showDescription="false"
        @increment="purchase.handleIncrement"
        @decrement="purchase.handleDecrement"
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
                purchase.product?.name || "Product Name"
              }}</IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="6">Cost per Item</IonCol>
              <IonCol class="ion-text-end"
                >MWK {{ purchase.costPerItem.toFixed(2) }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6">Quantity</IonCol>
              <IonCol class="ion-text-end"
                >x{{ purchase.product?.orderCount || 1 }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6"><strong>Subtotal</strong></IonCol>
              <IonCol class="ion-text-end"
                >MWK {{ purchase.subtotal.toFixed(2) }}</IonCol
              >
            </IonRow>
            <IonRow>
              <IonCol size="6"><strong>Total</strong></IonCol>
              <IonCol class="ion-text-end"
                ><strong>MWK {{ purchase.total.toFixed(2) }}</strong></IonCol
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
      @left-button-click="purchase.cancelOrder"
      @right-button-click="purchase.placeOrder"
    />

    <!-- Centered Success Popup -->
    <transition name="fade">
      <div v-if="purchase.showSuccessPopup" class="success-popup">
        <div class="popup-content">
          <h2>Success!</h2>
          <p>{{ purchase.popupMessage }}</p>
        </div>
      </div>
    </transition>
  </IonPage>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { useBuyAndPayStore } from "@/stores/buyAndPayStore";
import PaymentMethod from "@/components/PaymentMethod.vue";
import productDisplay from "@/components/productDisplay.vue";
import BuySegment from "@/components/BuySegment.vue";

export default defineComponent({
  name: "PayPage",
  components: {
    PaymentMethod,
    productDisplay,
    BuySegment,
  },
  setup() {
    const purchase = useBuyAndPayStore();
    const paymentMethodRef = ref(null);

    onMounted(() => {
      purchase.initializeProduct();
      purchase.setPaymentMethodRef(paymentMethodRef);
    });

    return {
      purchase,
      paymentMethodRef,
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
