<template>
  <ion-footer>
    <ion-toolbar>
      <ion-buttons class="footer-buttons">
        <ion-button router-link="/home">
          <div class="button-content">
            <ion-icon :icon="homeOutline"></ion-icon>
            <ion-label>Home</ion-label>
          </div>
        </ion-button>
        <ion-button router-link="/shop">
          <div class="button-content">
            <ion-icon :icon="cartOutline"></ion-icon>
            <ion-label>Shop</ion-label>
          </div>
        </ion-button>
        <ion-button router-link="/looking-for">
          <div class="button-content">
            <ion-icon :icon="searchOutline"></ion-icon>
            <ion-label>Looking For</ion-label>
          </div>
        </ion-button>
        <ion-button router-link="/sell">
          <div class="button-content">
            <ion-icon :icon="pricetagOutline"></ion-icon>
            <ion-label>Sell</ion-label>
          </div>
        </ion-button>
        <ion-button router-link="/Profile">
          <div class="button-content">
            <ion-icon :icon="personOutline"></ion-icon>
            <ion-label>Profile</ion-label>
          </div>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-footer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  homeOutline,
  cartOutline,
  searchOutline,
  pricetagOutline,
  personOutline,
} from "ionicons/icons";

export default defineComponent({
  name: "AppFooter",
  setup() {
    return {
      homeOutline,
      cartOutline,
      searchOutline,
      pricetagOutline,
      personOutline,
    };
  },
});
</script>

<style scoped>
.footer-buttons {
  display: flex;
  justify-content: space-around;
}

ion-button {
  --padding-start: 0;
  --padding-end: 0;
}

.button-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

ion-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

ion-label {
  font-size: 12px;
}
</style>
