<template>
  <IonToolbar class="shop-actions-toolbar">
    <!-- Left icons -->
    <IonButtons slot="start">
      <!-- Store icon -->
      <IonButton fill="clear" shape="round" @click="onStoreClick">
        <IonIcon slot="icon-only" :icon="storefrontOutline" />
      </IonButton>

      <!-- Cart icon with badge -->
      <IonButton
        fill="clear"
        shape="round"
        @click="onCartClick"
        class="cart-button"
      >
        <IonIcon slot="start" :icon="cartOutline" />
        <IonBadge slot="end" color="danger">{{ cartCount }}</IonBadge>
      </IonButton>
    </IonButtons>

    <!-- Right action buttons -->
    <IonButtons slot="primary">
      <IonButton
        fill="outline"
        color="dark"
        shape="round"
        @click="onAddToCart"
        class="action-button"
      >
        Add to cart
      </IonButton>
      <IonButton
        fill="solid"
        color="danger"
        shape="round"
        @click="onBuyNow"
        class="action-button"
      >
        Buy now
      </IonButton>
    </IonButtons>
  </IonToolbar>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
} from "@ionic/vue";

// Import only the icons we need
import { storefrontOutline, cartOutline } from "ionicons/icons";

// A reactive cart count, for demonstration:
const cartCount = ref(3);

// Example click handlers:
function onStoreClick() {
  console.log("Store icon clicked");
}

function onCartClick() {
  console.log("Cart icon clicked");
}

function onAddToCart() {
  console.log("Add to cart");
}

function onBuyNow() {
  console.log("Buy now");
}
</script>

<style scoped>
.shop-actions-toolbar {
  /* Ensure toolbar doesn’t overflow */
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  --ion-toolbar-background: #ffffff; /* Adjust toolbar color if desired */
  --ion-color-danger: #dc0000; /* Matches the “Buy now” red button */
}

.cart-button {
  position: relative;
}

/* Set consistent width and styling for the action buttons */
.action-button {
  width: 140px; /* Adjust to your desired width */
  font-size: 14px; /* Smaller font size */
  text-transform: none; /* Normal case (not uppercase) */
}
</style>
