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
        :placeholder="searchPlaceholder"
        show-cancel-button="focus"
        class="custom-searchbar"
        :value="searchQuery"
        @ionInput="updateSearchQuery"
        @keyup.enter="handleSearch"
      ></ion-searchbar>
    </ion-toolbar>

    <!-- Category Segment -->
    <CategorySegment v-if="showCategorySegment" />
  </ion-header>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { cartOutline } from "ionicons/icons";
import CategorySegment from "@/components/CategorySegment.vue";
import { useRouter, useRoute } from "vue-router";

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
    searchPlaceholder: {
      type: String,
      default: "Search products...",
    },
  },
  components: {
    CategorySegment,
  },
  setup() {
    const theme = useThemeStore();
    const router = useRouter();
    const route = useRoute();
    const searchQuery = ref(route.query.q?.toString() || "");

    // Update searchQuery when the route query changes
    watch(
      () => route.query.q,
      (newQuery) => {
        searchQuery.value = newQuery?.toString() || "";
      }
    );

    const updateSearchQuery = (event: CustomEvent) => {
      searchQuery.value = event.detail.value;
    };

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push({ name: "SearchResults", query: { q: searchQuery.value } });
      }
    };

    return {
      theme,
      searchQuery,
      updateSearchQuery,
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
  --placeholder-color: var(--ion-text-color);
  --color: var(--ion-text-color);
  --icon-color: var(--ion-text-color);
  --border-radius: 20px;
  border-radius: 50px;
  --box-shadow: none;
}

ion-header,
ion-toolbar {
  --background: var(--ion-background-color);
  background: var(--ion-background-color);
  box-shadow: none;
  border: none;
}
</style>
