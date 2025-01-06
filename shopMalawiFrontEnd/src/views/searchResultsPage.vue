<template>
  <ion-page>
    <appHeader :showCategorySegment="false" />

    <ion-header>
      <ion-toolbar>
        <ion-title>Search Results</ion-title>
      </ion-toolbar>

      <!-- Filters and Sorting -->
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
            type="number"
            v-model.number="minPrice"
            class="filter-item"
            @ionBlur="fetchProducts"
          ></ion-input>
          <ion-input
            placeholder="Max Price"
            type="number"
            v-model.number="maxPrice"
            class="filter-item"
            @ionBlur="fetchProducts"
          ></ion-input>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading and No Results -->
      <div v-if="loading" class="loading">Loading...</div>
      <div v-else-if="products.length === 0" class="no-results">
        No results found.
      </div>

      <!-- Product Grid -->
      <ion-grid v-else>
        <ion-row>
          <ion-col size="6" v-for="product in products" :key="product.id">
            <ion-card class="product-card">
              <ion-img
                :src="getImageUrl(product.images[0]?.image_path)"
                alt="Product Image"
                class="product-image"
              ></ion-img>
              <ion-card-content>
                <h2 class="product-name">{{ product.name }}</h2>
                <p class="product-price">{{ formatPrice(product.price) }}</p>
                <p class="product-category">Category: {{ product.category }}</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-content>

    <appFooter />
  </ion-page>
</template>

<script>
import { defineComponent, ref, watch } from "vue";
import axios from "axios";
import appHeader from "@/components/header.vue";
import appFooter from "@/components/footer.vue";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "SearchResultsPage",
  components: {
    appHeader,
    appFooter,
  },
  setup() {
    const route = useRoute();
    const query = ref(route.query.q?.toString() || "");
    const products = ref([]);
    const loading = ref(false);
    const sortBy = ref("priceAsc");
    const minPrice = ref(null);
    const maxPrice = ref(null);

    // Watch for changes in the route query
    watch(
      () => route.query.q,
      (newQuery) => {
        query.value = newQuery?.toString() || "";
        fetchProducts();
      }
    );

    const fetchProducts = async () => {
      loading.value = true;
      try {
        const params = {
          query: query.value,
          sortBy: sortBy.value,
        };

        if (minPrice.value) params.priceRange = `${minPrice.value},`;
        if (maxPrice.value)
          params.priceRange = params.priceRange
            ? `${params.priceRange}${maxPrice.value}`
            : `,${maxPrice.value}`;

        const response = await axios.get(
          "http://localhost:1994/api/search/searchProducts",
          { params }
        );
        products.value = response.data;
      } catch (error) {
        console.error("Error fetching search results:", error);
        products.value = [];
      } finally {
        loading.value = false;
      }
    };

    const formatPrice = (price) => {
      const numericPrice = parseFloat(price);
      if (isNaN(numericPrice)) return "N/A";
      return `MWK${numericPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
      })}`;
    };

    const getImageUrl = (imagePath) => {
      return imagePath
        ? `http://localhost:1994${imagePath}`
        : "/assets/default-image.jpg";
    };

    // Fetch products on component mount
    fetchProducts();

    return {
      query,
      products,
      loading,
      sortBy,
      minPrice,
      maxPrice,
      fetchProducts,
      formatPrice,
      getImageUrl,
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

.product-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.product-image {
  height: 150px;
  object-fit: cover;
}

.product-name {
  font-size: 16px;
  font-weight: bold;
  margin: 10px 0 5px;
  color: var(--ion-text-color);
}

.product-price {
  font-size: 14px;
  color: var(--ion-color-primary);
}

.product-category {
  font-size: 12px;
  color: var(--ion-text-color);
}
</style>
