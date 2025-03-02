//src/components/BuySegment.vue
<template>
  <div
    v-if="props.disclaimerText"
    class="disclaimer-text"
    v-html="props.disclaimerText"
  ></div>

  <IonToolbar class="shop-actions-toolbar">
    <IonButtons v-if="props.showIcons" slot="start">
      <!-- Store Button -->
      <IonButton @click="onStoreClick">
        <div class="button-content">
          <IonIcon :icon="storefrontOutline" class="big-icon" />
          <IonLabel class="button-label">visit store</IonLabel>
        </div>
      </IonButton>

      <!-- Cart Button (badge removed) -->
      <IonButton
        v-if="!buyAndPayStore.isProductOwner"
        @click="onCartClick"
        class="cart-button"
      >
        <div class="button-content">
          <IonIcon :icon="cartOutline" class="big-icon" />
          <IonLabel class="button-label">cart</IonLabel>
        </div>
      </IonButton>
    </IonButtons>

    <IonButtons v-if="!buyAndPayStore.isProductOwner" slot="primary">
      <IonButton
        fill="outline"
        color="dark"
        shape="round"
        @click="onLeftButtonClick"
        class="action-button"
      >
        {{ props.leftButtonText }}
      </IonButton>
      <IonButton
        fill="solid"
        color="danger"
        shape="round"
        @click="onRightButtonClick"
        class="action-button"
      >
        {{ props.rightButtonText }}
      </IonButton>
    </IonButtons>
  </IonToolbar>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { storefrontOutline, cartOutline } from "ionicons/icons";
import { useBuyAndPayStore } from "@/stores/buyAndPayStore";

const buyAndPayStore = useBuyAndPayStore();

const props = defineProps({
  leftButtonText: {
    type: String,
    default: "Add to cart",
  },
  rightButtonText: {
    type: String,
    default: "Buy now",
  },
  showIcons: {
    type: Boolean,
    default: true,
  },
  cartCount: {
    type: Number,
    default: 0,
  },
  disclaimerText: {
    type: String,
    default:
      "Upon clicking 'Buy Now', I confirm I have read and acknowledged all <a href='/terms' class='terms-link'>terms and policies</a>.",
  },
});

const emit = defineEmits([
  "left-button-click",
  "right-button-click",
  "store-click",
  "cart-click",
]);

const router = useRouter();

onMounted(() => {
  buyAndPayStore.initializeProduct();
});

function onStoreClick(): void {
  emit("store-click");
}

function onCartClick(): void {
  emit("cart-click");
  router.push("/cart");
}

function onLeftButtonClick(): void {
  emit("left-button-click");
}

function onRightButtonClick(): void {
  emit("right-button-click");
  router.push("/pay");
}
</script>

<style scoped>
.disclaimer-text {
  font-size: 0.6rem;
  color: #666;
  margin: 8px 16px;
  line-height: 1.4;
}

.shop-actions-toolbar {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  --ion-toolbar-background: #ffffff;
  --ion-color-danger: #dc0000;
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Increase the icon size */
.big-icon {
  font-size: 30px;
}

.button-label {
  font-size: 13px;
  margin-top: 2px;
}

.cart-button {
  position: relative;
}

.action-button {
  width: 140px;
  font-size: 14px;
  text-transform: none;
}
</style>
