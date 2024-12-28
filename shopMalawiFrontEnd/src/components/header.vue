<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <img :src="logo" alt="ShopMalawi Logo" class="header-logo" />
      </ion-buttons>
      <ion-buttons slot="end">
        <ion-button aria-label="Cart">
          <ion-icon :icon="cartOutline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button @click="theme.toggleTheme" aria-label="Toggle Theme">
          <ion-icon :icon="theme.themeIcon" slot="icon-only"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <ion-toolbar>
      <ion-searchbar
        placeholder="Search products..."
        :debounce="500"
        show-cancel-button="focus"
        class="custom-searchbar"
        @ionInput="handleSearch"
      ></ion-searchbar>
    </ion-toolbar>

    <ion-toolbar>
      <ion-segment scrollable class="category-segment">
        <ion-segment-button
          v-for="category in categories"
          :key="category.value"
          :value="category.value"
        >
          {{ category.label }}
        </ion-segment-button>
      </ion-segment>
    </ion-toolbar>
  </ion-header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonIcon,
} from "@ionic/vue";
import { useThemeStore } from "@/stores/themeStore";
import { cartOutline } from "ionicons/icons"; // Import the cart icon

export default defineComponent({
  name: "ShopMalawiHeader",
  components: {
    IonHeader,
    IonToolbar,
    IonButtons,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonIcon,
  },
  props: {
    logo: {
      type: String,
      default: "/assets/logo.png",
    },
    categories: {
      type: Array,
      default: () => [
        { value: "explore", label: "Explore" },
        { value: "women", label: "Women's" },
        { value: "electronics", label: "Electronics" },
        // Add more default categories
      ],
    },
  },
  setup() {
    const theme = useThemeStore();

    const handleSearch = (event: CustomEvent) => {
      const query = event.detail.value;
      console.log("Search query:", query);
      // Add your search logic here
    };

    return {
      theme,
      handleSearch,
      cartOutline, // Return the cart icon
    };
  },
});
</script>

<style scoped>
.header-logo {
  height: 30px;
  object-fit: contain;
}

ion-searchbar.custom-searchbar {
  --background: var(--ion-background-color);
  --placeholder-color: var(--ion-text-color);
  --color: var(--ion-text-color);
  --icon-color: var(--ion-text-color);
  --border-radius: 50px;
  border-radius: 50px;
  --box-shadow: none;
  border: 2px solid var(--ion-text-color);
}

ion-header,
ion-toolbar {
  --background: transparent;
  box-shadow: none;
  border: none;
}

.category-segment {
  --background: var(--ion-background-color);
}

.category-segment ion-segment-button {
  --color: var(--ion-color-step-200, #666);
  --indicator-color: var(--ion-color-primary);
}

[data-theme="dark"] .category-segment ion-segment-button {
  --color: var(--ion-color-step-200, #eee);
}

.category-segment ion-segment-button.segment-button-checked {
  color: var(--ion-color-primary-shade) !important;
}

[data-theme="dark"]
  .category-segment
  ion-segment-button.segment-button-checked {
  color: var(--ion-color-primary-shade) !important;
  --indicator-color: var(--ion-color-primary-shade);
}

/* Ensure the cart button is visible */
ion-button {
  --color: var(--ion-text-color); /* Use the default text color */
}
</style>
