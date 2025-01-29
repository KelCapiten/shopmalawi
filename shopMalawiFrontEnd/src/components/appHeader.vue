<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <img src="/assets/logo.png" alt="ShopMalawi Logo" class="header-logo" />
      </ion-buttons>
      <ion-buttons slot="end">
        <ion-button aria-label="Cart">
          <ion-icon :icon="cartOutline" slot="icon-only"></ion-icon>
        </ion-button>
        <ion-button @click="toggleTheme" aria-label="Toggle Theme">
          <ion-icon slot="icon-only"></ion-icon>
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

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

    <CategorySegment v-if="showCategorySegment" />
  </ion-header>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import CategorySegment from "@/components/CategorySegment.vue";
import { cartOutline } from "ionicons/icons";

const props = defineProps({
  showSearchBar: { type: Boolean, default: true },
  showCategorySegment: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: "Search" },
});

function toggleTheme() {}
const router = useRouter();
const searchQuery = ref("");

function updateSearchQuery(e: CustomEvent) {
  searchQuery.value = e.detail.value;
}

function handleSearch() {
  router.push({
    name: "SearchResults",
    query: { query: searchQuery.value },
  });
}
</script>

<style scoped>
.header-logo {
  max-height: 40px;
}
.search-bar {
  --background: var(--ion-color-light);
}
</style>

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
