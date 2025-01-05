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

    <!-- Search Bar -->
    <ion-toolbar class="search-bar" v-if="showSearchBar">
      <ion-searchbar
        placeholder="Search products..."
        :debounce="500"
        show-cancel-button="focus"
        class="custom-searchbar"
        @ionInput="handleSearch"
      ></ion-searchbar>
    </ion-toolbar>

    <!-- Category Segment -->
    <CategorySegment v-if="showCategorySegment" />
  </ion-header>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { cartOutline } from "ionicons/icons";
import CategorySegment from "@/components/CategorySegment.vue";

export default defineComponent({
  name: "ShopMalawiHeader",
  props: {
    logo: {
      type: String,
      default: "/assets/logo.png",
    },
    showSearchBar: {
      type: Boolean,
      default: true,
    },
    showCategorySegment: {
      type: Boolean,
      default: true,
    },
  },
  components: {
    CategorySegment,
  },
  setup() {
    const theme = useThemeStore();

    const handleSearch = (event: CustomEvent) => {
      const query = event.detail.value?.trim() || "";
      console.log("Search query:", query);
      // Add your search logic here
    };

    return {
      theme,
      handleSearch,
      cartOutline,
    };
  },
});
</script>

<style scoped>
.header-logo {
  height: 30px;
  object-fit: contain;
}

.search-bar {
  padding: 0 20px;
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
  --background: var(--ion-background-color);
  background: var(--ion-background-color);
  box-shadow: none;
  border: none;
}
</style>
