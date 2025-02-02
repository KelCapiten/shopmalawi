<!-- src/views/PayPage.vue -->
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
        infoPosition="side"
        :enableCounter="true"
        @increment="handleIncrement"
        @decrement="handleDecrement"
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

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from "vue";
import router from "@/router";
import { loadProductFromSessionStorage } from "@/utils/utilities";
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
    const product = ref<any>(null);

    onMounted(() => {
      const loadedProduct = loadProductFromSessionStorage<any>();
      if (loadedProduct) {
        product.value = loadedProduct;
      } else {
        router.replace({ name: "shop" });
      }
    });

    // Wrap the product in a subcategory array for productDisplay
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
    const onPlaceOrder = () => router.push({ name: "pay" });

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
    };
  },
});
</script>

<style scoped>
.summary-card {
  margin-top: 1.5rem;
}
</style>
