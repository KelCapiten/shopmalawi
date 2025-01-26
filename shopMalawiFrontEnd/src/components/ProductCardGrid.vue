<template>
  <div class="product-card-grid">
    <div v-if="enableSearch" class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Offer your product. Search here..."
        class="search-input"
        @input="handleSearchInput"
      />
    </div>

    <div v-if="isLoading" class="loading-indicator">Loading...</div>

    <div v-if="error" class="error-message">{{ error }}</div>

    <label class="section-heading">{{ heading }}</label>
    <div
      :class="[
        'product-list',
        { 'single-column': infoPosition === 'side' && !enableCounter },
      ]"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="item"
        :class="[
          { 'info-side': infoPosition === 'side' },
          { 'small-image': infoPosition === 'side' && imageSize === 'small' },
          { 'full-row': infoPosition === 'side' && !enableCounter },
        ]"
        @click="emitProductClicked(product)"
      >
        <div class="image-container">
          <img
            :src="getPrimaryImage(product.images)"
            :alt="product.name"
            class="item-image"
          />
        </div>
        <div class="item-details">
          <h2 v-if="infoPosition !== 'side'" class="product-name">
            {{ product.name }}
          </h2>
          <p class="price">MWK {{ product.price }}</p>
          <p class="stock-info">{{ product.stock_quantity }} in stock</p>
          <p v-if="infoPosition === 'side'" class="description">
            {{ product.description }}
          </p>
        </div>
        <div
          v-if="infoPosition === 'side' && enableCounter"
          class="side-counter"
        >
          <label class="counter-label">
            <span class="buy-text">I'd like to buy</span>
            <span class="count">{{ product.orderCount || 1 }}</span>
          </label>
          <div class="counter-controls">
            <button @click.stop="decrement(product)">-</button>
            <button @click.stop="increment(product)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
  computed,
  watch,
  onMounted,
} from "vue";
import debounce from "lodash/debounce";
import { useAuthStore } from "@/stores/authStore";

interface Image {
  image_path: string;
  is_primary: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  images: Image[];
  orderCount?: number;
  inquiries_id?: number | null;
}

interface SearchResponseGroup {
  products: Product[];
}

export default defineComponent({
  name: "ProductCardGrid",
  props: {
    heading: { type: String, required: true },
    products: {
      type: Array as PropType<Product[]>,
      required: false,
      default: () => [],
    },
    infoPosition: {
      type: String as PropType<"bottom" | "side">,
      default: "bottom",
    },
    enableSearch: {
      type: Boolean,
      default: false,
    },
    imageSize: {
      type: String as PropType<"default" | "small">,
      default: "default",
    },
    enableCounter: {
      type: Boolean,
      default: true,
    },
    inquiries_id: {
      type: Number as PropType<number | null>,
      default: null,
    },
  },
  setup(props, { emit }) {
    const searchQuery = ref("");
    const filteredProducts = ref<Product[]>(props.products);
    const isLoading = ref(false);
    const error = ref("");
    const authStore = useAuthStore();

    const loggedInUserId = computed(() => authStore.user?.id);

    onMounted(() => {
      if (props.products.length > 0) {
        filteredProducts.value = props.products;
      }
    });

    const debouncedSearch = debounce(async (query: string) => {
      if (!props.enableSearch) return;

      if (!query) {
        filteredProducts.value = props.products;
        return;
      }

      isLoading.value = true;
      error.value = "";

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:1994";
        const response = await fetch(
          `${API_BASE_URL}/api/search/searchProductsExcludingOffered?query=${encodeURIComponent(
            query
          )}&inquiries_id=${props.inquiries_id}&uploaded_by=${
            loggedInUserId.value
          }`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data: SearchResponseGroup[] = await response.json();
        filteredProducts.value = data.flatMap((group) => group.products);
      } catch (err) {
        error.value = "Failed to perform search. Please try again.";
        console.error("Error searching for products:", err);
      } finally {
        isLoading.value = false;
      }
    }, 1000);

    watch(
      () => props.products,
      (newProducts) => {
        if (newProducts.length > 0) {
          filteredProducts.value = newProducts;
        }
      }
    );

    watch(searchQuery, (newQuery) => {
      if (props.enableSearch) {
        debouncedSearch(newQuery);
      }
    });

    const handleSearchInput = () => {
      if (props.enableSearch) {
        debouncedSearch(searchQuery.value);
      }
    };

    const getPrimaryImage = (images: Image[]) => {
      const primaryImage = images.find((image) => image.is_primary === 1);
      return primaryImage
        ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:1994"}${
            primaryImage.image_path
          }`
        : "https://via.placeholder.com/150";
    };

    const increment = (product: Product) => {
      if (!product.orderCount) product.orderCount = 1;
      if (product.orderCount < product.stock_quantity) {
        product.orderCount++;
      }
    };

    const decrement = (product: Product) => {
      if (!product.orderCount || product.orderCount <= 1) {
        product.orderCount = 1;
      } else {
        product.orderCount--;
      }
    };

    const emitProductClicked = (product: Product) => {
      product.inquiries_id = props.inquiries_id;
      emit("productClicked", product);
    };

    return {
      searchQuery,
      filteredProducts,
      isLoading,
      error,
      handleSearchInput,
      getPrimaryImage,
      increment,
      decrement,
      emitProductClicked,
    };
  },
});
</script>

<style scoped>
.product-card-grid {
  padding: 16px;
  width: 100%;
}

.search-container {
  margin-bottom: 16px;
}

.search-input {
  width: 100%;
  padding: 8px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.search-input:focus {
  border-color: #2196f3;
}

.loading-indicator,
.error-message {
  text-align: center;
  font-size: 1rem;
  margin: 16px 0;
}

.loading-indicator {
  color: #888;
}

.error-message {
  color: #ff0000;
}

.section-heading {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #222;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  width: 100%;
}

.single-column {
  grid-template-columns: 1fr;
}

.item {
  display: flex;
  flex-direction: column;
  text-align: left;
  background-color: #fff;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.image-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  transition: width 0.3s, height 0.3s;
}

.small-image .image-container {
  width: 50px;
  height: 50px;
  aspect-ratio: unset;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  margin-top: 8px;
  flex: 1;
}

.product-name {
  font-size: 0.9rem;
  color: #4e4e4e;
  margin: 4px 0;
}

.price {
  font-size: 1rem;
  font-weight: bold;
  color: #000;
  margin: 0;
}

.stock-info {
  font-size: 0.8rem;
  color: #888;
  margin: 0;
}

.info-side {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 16px;
}

.small-image.info-side .image-container {
  width: 50px;
  height: 50px;
}

.description {
  font-size: 0.8rem;
  color: #181818;
  margin-top: 4px;
}

.side-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  grid-column: 1 / -1;
}

.counter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.buy-text {
  font-weight: bold;
  color: #000;
  font-size: 0.8rem;
}

.count {
  color: #2196f3;
  font-weight: bold;
  font-size: 0.9rem;
}

.counter-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.counter-controls button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.counter-controls button:hover {
  background-color: #e0e0e0;
}

.full-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: left;
}

.full-row .image-container {
  width: 150px;
  height: 150px;
  aspect-ratio: 1;
  flex-shrink: 0;
  margin-right: 24px;
}

.full-row .item-details {
  flex: 1;
}

.full-row .description {
  margin-top: 8px;
}
</style>
