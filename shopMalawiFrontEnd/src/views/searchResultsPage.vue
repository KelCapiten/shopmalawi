<template>
  <ion-page>
    <appHeader :showCategorySegment="false" />

    <ion-header>
      <ion-toolbar class="filter-toolbar">
        <div class="filter-container">
          <ion-select
            placeholder="Sort By"
            v-model="sortBy"
            @ionChange="fetchProducts"
            class="filter-item"
          >
            <ion-select-option value="priceAsc"
              >Price: Low to High</ion-select-option
            >
            <ion-select-option value="priceDesc"
              >Price: High to Low</ion-select-option
            >
            <ion-select-option value="nameAsc">Name: A to Z</ion-select-option>
            <ion-select-option value="nameDesc">Name: Z to A</ion-select-option>
          </ion-select>
          <ion-input
            placeholder="Min Price"
            type="text"
            pattern="[0-9]*"
            :value="minPriceDisplay"
            @ionInput="handleMinPriceInput"
            class="filter-item"
          />
          <ion-input
            placeholder="Max Price"
            type="text"
            pattern="[0-9]*"
            :value="maxPriceDisplay"
            @ionInput="handleMaxPriceInput"
            class="filter-item"
          />
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="products.length === 0" class="no-results">
        No results found.
      </div>
      <div v-else class="Results">
        <productDisplay
          heading="Is this what you are looking for?"
          :products="products"
          @productClicked="navigateToProductPage"
        />
      </div>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useSearch } from "@/composables/useSearch";
import { navigateToProductPage, debounce } from "@/utils/utilities";
import appHeader from "@/components/appHeader.vue";
import appFooter from "@/components/appFooter.vue";
import productDisplay from "@/components/productDisplay.vue";

const { results, loading, error, searchForProducts } = useSearch();
const route = useRoute();
const sortBy = ref("");
const minPrice = ref<number | null>(null);
const maxPrice = ref<number | null>(null);

function buildPriceRange() {
  if (minPrice.value !== null && maxPrice.value !== null)
    return `${minPrice.value},${maxPrice.value}`;
  if (minPrice.value !== null) return `${minPrice.value},`;
  if (maxPrice.value !== null) return `,${maxPrice.value}`;
}

const products = computed(() => results.value);
const minPriceDisplay = computed(() =>
  minPrice.value !== null ? minPrice.value : ""
);
const maxPriceDisplay = computed(() =>
  maxPrice.value !== null ? maxPrice.value : ""
);

async function fetchProducts() {
  await searchForProducts({
    query: route.query.query as string,
    priceRange: buildPriceRange(),
    sortBy: sortBy.value,
  });
}

const debouncedFetch = debounce(fetchProducts, 1000);

function handleMinPriceInput(e: CustomEvent) {
  minPrice.value = parseInt(e.detail.value, 10) || null;
  debouncedFetch();
}
function handleMaxPriceInput(e: CustomEvent) {
  maxPrice.value = parseInt(e.detail.value, 10) || null;
  debouncedFetch();
}

onMounted(fetchProducts);

watch(() => route.query, fetchProducts);
</script>

<style scoped>
.filter-toolbar {
  --background: var(--ion-background-color);
  padding: 10px 20px;
}
.filter-container {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-item {
  flex: 1;
}
.Results {
  margin-top: 15px;
}
.loading,
.no-results {
  text-align: center;
  padding: 20px;
  font-size: 18px;
  color: var(--ion-text-color);
}
</style>
