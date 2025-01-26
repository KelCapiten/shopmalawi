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
          ></ion-input>
          <ion-input
            placeholder="Max Price"
            type="text"
            pattern="[0-9]*"
            :value="maxPriceDisplay"
            @ionInput="handleMaxPriceInput"
            class="filter-item"
          ></ion-input>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="subcategories.length === 0" class="no-results">
        No results found.
      </div>
      <template v-else>
        <div v-for="subcategory in subcategories" :key="subcategory.id">
          <ProductCardGrid
            :heading="subcategory.name"
            :products="subcategory.products"
            @productClicked="navigateToProductPage"
          />
        </div>
      </template>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script>
import { defineComponent, ref, computed, watch } from "vue";
import axios from "axios";
import appHeader from "@/components/header.vue";
import appFooter from "@/components/footer.vue";
import ProductCardGrid from "@/components/ProductCardGrid.vue";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  name: "SearchResultsPage",
  components: {
    appHeader,
    appFooter,
    ProductCardGrid,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const query = ref(route.query.q?.toString() || "");
    const subcategories = ref([]);
    const loading = ref(false);
    const sortBy = ref("priceAsc");
    const minPrice = ref(undefined);
    const maxPrice = ref(undefined);
    let debounceTimer = null;

    const minPriceDisplay = computed({
      get: () =>
        minPrice.value === undefined ? "" : minPrice.value.toString(),
      set: (value) => {
        minPrice.value = value === "" ? undefined : Number(value);
      },
    });

    const maxPriceDisplay = computed({
      get: () =>
        maxPrice.value === undefined ? "" : maxPrice.value.toString(),
      set: (value) => {
        maxPrice.value = value === "" ? undefined : Number(value);
      },
    });

    const debounce = (func, delay) => {
      return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func(...args), delay);
      };
    };

    const fetchProducts = async () => {
      loading.value = true;
      try {
        const params = {
          query: query.value,
          sortBy: sortBy.value,
          priceRange:
            minPrice.value !== undefined || maxPrice.value !== undefined
              ? `${minPrice.value || ""},${maxPrice.value || ""}`
              : undefined,
        };

        const response = await axios.get(
          "http://localhost:1994/api/search/searchProducts",
          { params }
        );

        subcategories.value = response.data;
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        loading.value = false;
      }
    };

    const handleMinPriceInput = (event) => {
      const value = event.target.value;
      minPriceDisplay.value = value;
      debounce(fetchProducts, 500)();
    };

    const handleMaxPriceInput = (event) => {
      const value = event.target.value;
      maxPriceDisplay.value = value;
      debounce(fetchProducts, 500)();
    };

    watch(
      () => route.query.q,
      (newQuery) => {
        query.value = newQuery?.toString() || "";
        minPrice.value = undefined;
        maxPrice.value = undefined;
        fetchProducts();
      },
      { immediate: true }
    );

    const navigateToProductPage = (product) => {
      sessionStorage.setItem("selectedProduct", JSON.stringify(product));
      router.push({ name: "ProductPage", params: { id: product.id } });
    };

    return {
      query,
      subcategories,
      loading,
      sortBy,
      minPriceDisplay,
      maxPriceDisplay,
      fetchProducts,
      handleMinPriceInput,
      handleMaxPriceInput,
      navigateToProductPage,
    };
  },
});
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

.loading,
.no-results {
  text-align: center;
  padding: 20px;
  font-size: 18px;
  color: var(--ion-text-color);
}
</style>
