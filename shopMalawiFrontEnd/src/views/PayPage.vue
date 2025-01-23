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
      <ProductCardGrid
        v-if="product"
        :products="[product]"
        infoPosition="side"
        @navigateToProductPage="handleProductNavigation"
      />

      <PaymentMethod />

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
  </IonPage>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import PaymentMethod from "@/components/PaymentMethod.vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";
import BuySegment from "@/components/BuySegment.vue";

export default {
  name: "HomePage",
  components: { PaymentMethod, ProductCardGrid, BuySegment },
  setup() {
    const router = useRouter();
    const product = ref(null);
    const loadProduct = () => {
      const stored = sessionStorage.getItem("selectedProduct");
      if (stored) {
        product.value = JSON.parse(stored);
        product.value.orderCount = Math.max(product.value.orderCount || 1, 1);
      } else {
        router.replace({ name: "shop" });
      }
    };
    const handleProductNavigation = () => {};
    const costPerItem = computed(() =>
      product.value ? parseFloat(product.value.price) : 0
    );
    const subtotal = computed(
      () => costPerItem.value * (product.value?.orderCount || 1)
    );
    const total = computed(() => subtotal.value);
    const onCancelOrder = () => router.back();
    const onPlaceOrder = () => router.push({ name: "pay" });
    onMounted(loadProduct);
    return {
      product,
      costPerItem,
      subtotal,
      total,
      handleProductNavigation,
      onCancelOrder,
      onPlaceOrder,
    };
  },
};
</script>

<style scoped>
.summary-card {
  margin-top: 1.5rem;
}
</style>
